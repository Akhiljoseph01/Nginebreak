import localforage from "localforage";
import { v4 as uuidv4 } from "uuid";
import {
  recalculateVehicleMaintenance,
  calculateMaintenanceStatus,
} from "./CalculationEngine";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

localforage.config({
  name: "DigitalGarage",
  version: 1.0,
  storeName: "garage_data",
});

const DEFAULT_DATA = {
  user: { name: "Enthusiast" },
  vehicles: [],
};

// ============================================================
// Helper: get current auth user id + display name
// ============================================================
async function getCurrentAuthUser() {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    // Fetch display_name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    return {
      id: user.id,
      email: user.email,
      display_name: profile?.display_name || user.email?.split("@")[0] || "Member",
    };
  } catch {
    return null;
  }
}

class StorageService {
  async init() {
    const data = await localforage.getItem("garage_data");
    if (!data) {
      await localforage.setItem("garage_data", DEFAULT_DATA);
    }
  }

  // ==========================================
  // Get Data — scoped to current user via garage_members
  // ==========================================
  async getData() {
    await this.init();

    if (isSupabaseConfigured() && supabase) {
      try {
        const authUser = await getCurrentAuthUser();

        let vehicleIds = null;

        if (authUser) {
          // Get vehicles this user is a member of
          const { data: memberRows, error: memberErr } = await supabase
            .from("garage_members")
            .select("vehicle_id")
            .eq("user_id", authUser.id);
          if (memberErr) throw memberErr;
          vehicleIds = (memberRows || []).map((r) => r.vehicle_id);
        }

        let vehiclesQuery = supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: true });

        if (vehicleIds && vehicleIds.length > 0) {
          vehiclesQuery = vehiclesQuery.in("id", vehicleIds);
        } else if (vehicleIds && vehicleIds.length === 0) {
          // User has no vehicles yet
          const cloudData = {
            user: {
              name: authUser?.display_name || "Enthusiast",
              id: authUser?.id,
            },
            vehicles: [],
          };
          await localforage.setItem("garage_data", cloudData);
          return cloudData;
        }

        const { data: dbVehicles, error: vErr } = await vehiclesQuery;
        if (vErr) throw vErr;

        if (dbVehicles) {
          const { data: dbModules } = await supabase
            .from("maintenance_modules")
            .select("*");

          const { data: dbHistory } = await supabase
            .from("service_history")
            .select("*")
            .order("date", { ascending: false });

          const assembledVehicles = await Promise.all(
            dbVehicles.map(async (veh) => {
              const rawModules = (dbModules || []).filter(
                (m) => m.vehicle_id === veh.id
              );
              const rawHistory = (dbHistory || []).filter(
                (h) => h.vehicle_id === veh.id
              );

              const modules = rawModules.map((mod) => {
                const calc = calculateMaintenanceStatus(
                  mod,
                  veh.current_odometer
                );
                return { ...mod, ...calc };
              });

              // Fetch members for this vehicle
              const { data: memberRows } = await supabase
                .from("garage_members")
                .select("user_id, role")
                .eq("vehicle_id", veh.id);

              const memberIds = (memberRows || []).map((r) => r.user_id);
              let memberProfiles = [];
              if (memberIds.length > 0) {
                const { data: profiles } = await supabase
                  .from("profiles")
                  .select("id, display_name")
                  .in("id", memberIds);
                memberProfiles = (profiles || []).map((p) => {
                  const row = (memberRows || []).find((r) => r.user_id === p.id);
                  return {
                    user_id: p.id,
                    display_name: p.display_name,
                    role: row?.role || "member",
                  };
                });
              }

              return {
                ...veh,
                media: veh.media || [],
                maintenance_modules: modules,
                service_history: rawHistory,
                members: memberProfiles,
              };
            })
          );

          const cloudData = {
            user: {
              name: authUser?.display_name || "Enthusiast",
              id: authUser?.id,
            },
            vehicles: assembledVehicles,
          };

          await localforage.setItem("garage_data", cloudData);
          return cloudData;
        }
      } catch (err) {
        console.warn(
          "[StorageService] Supabase sync failed, falling back to local cache:",
          err.message
        );
      }
    }

    return (await localforage.getItem("garage_data")) || DEFAULT_DATA;
  }

  async saveData(data) {
    await localforage.setItem("garage_data", data);
  }

  // ==========================================
  // Add Vehicle
  // ==========================================
  async addVehicle(vehicleParams) {
    const newVehicleId = uuidv4();
    const authUser = await getCurrentAuthUser();
    const newVehicle = {
      id: newVehicleId,
      type: vehicleParams.type || "Car",
      make: vehicleParams.make,
      model: vehicleParams.model,
      year: parseInt(vehicleParams.year),
      current_odometer: parseInt(vehicleParams.odometer) || 0,
      maintenance_modules: [],
      service_history: [],
      members: authUser
        ? [
            {
              user_id: authUser.id,
              display_name: authUser.display_name,
              role: "owner",
            },
          ]
        : [],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from("vehicles").insert([
          {
            id: newVehicle.id,
            user_id: authUser?.id || null,
            type: newVehicle.type,
            make: newVehicle.make,
            model: newVehicle.model,
            year: newVehicle.year,
            current_odometer: newVehicle.current_odometer,
          },
        ]);
        if (error) throw error;

        // Insert owner into garage_members
        if (authUser) {
          await supabase.from("garage_members").insert([
            {
              vehicle_id: newVehicleId,
              user_id: authUser.id,
              role: "owner",
            },
          ]);
        }

        // Record initial odometer reading
        if (newVehicle.current_odometer > 0 && authUser) {
          await supabase.from("odometer_history").insert([
            {
              vehicle_id: newVehicleId,
              user_id: authUser.id,
              added_by_name: authUser.display_name,
              odometer_value: newVehicle.current_odometer,
              previous_value: 0,
              is_rewound: false,
            },
          ]);
        }
      } catch (err) {
        console.error(
          "[StorageService] Supabase vehicle insert failed:",
          err.message
        );
      }
    }

    const data = await this.getData().catch(() => DEFAULT_DATA);
    if (!data.vehicles) data.vehicles = [];
    if (!data.vehicles.some((v) => v.id === newVehicle.id)) {
      data.vehicles.push(newVehicle);
    }
    await this.saveData(data);
    return newVehicle;
  }

  // ==========================================
  // Add Maintenance Module
  // ==========================================
  async addMaintenanceModule(vehicleId, moduleParams) {
    const moduleId = uuidv4();
    const newModule = {
      id: moduleId,
      vehicle_id: vehicleId,
      name: moduleParams.name,
      interval_km: moduleParams.interval_km
        ? parseInt(moduleParams.interval_km)
        : null,
      interval_months: moduleParams.interval_months
        ? parseInt(moduleParams.interval_months)
        : null,
      last_service_km: moduleParams.last_service_km
        ? parseInt(moduleParams.last_service_km)
        : null,
      last_service_date: moduleParams.last_service_date || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("maintenance_modules")
          .insert([newModule]);
        if (error)
          console.error("[StorageService] Supabase module insert error:", error.message);
      } catch (err) {
        console.error(
          "[StorageService] Supabase module insert failed:",
          err.message
        );
      }
    }

    const data = await this.getData();
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const calc = calculateMaintenanceStatus(
      newModule,
      vehicle.current_odometer
    );
    Object.assign(newModule, calc);

    if (!vehicle.maintenance_modules.some((m) => m.id === moduleId)) {
      vehicle.maintenance_modules.push(newModule);
    }
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Update Odometer — append-only with history
  // ==========================================
  async updateOdometer(vehicleId, newOdometer) {
    const odo = parseInt(newOdometer);
    const authUser = await getCurrentAuthUser();

    // Fetch the current odometer BEFORE updating
    let prevOdo = 0;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: vehRow } = await supabase
          .from("vehicles")
          .select("current_odometer")
          .eq("id", vehicleId)
          .single();
        prevOdo = vehRow?.current_odometer || 0;
      } catch (_) {}
    } else {
      const data = await this.getData();
      const v = data.vehicles.find((v) => v.id === vehicleId);
      prevOdo = v?.current_odometer || 0;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Append to odometer_history
        await supabase.from("odometer_history").insert([
          {
            vehicle_id: vehicleId,
            user_id: authUser?.id || null,
            added_by_name: authUser?.display_name || "Unknown",
            odometer_value: odo,
            previous_value: prevOdo,
            is_rewound: false,
          },
        ]);

        // 2. Update vehicle current_odometer
        const { error } = await supabase
          .from("vehicles")
          .update({
            current_odometer: odo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vehicleId);
        if (error)
          console.error("[StorageService] Supabase update odometer error:", error.message);
      } catch (err) {
        console.error(
          "[StorageService] Supabase update odometer failed:",
          err.message
        );
      }
    }

    let data = await this.getData();
    data.vehicles = recalculateVehicleMaintenance(data.vehicles, vehicleId, odo);
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Get Odometer History for a vehicle
  // ==========================================
  async getOdometerHistory(vehicleId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("odometer_history")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("[StorageService] getOdometerHistory failed:", err.message);
      }
    }
    return [];
  }

  // ==========================================
  // Rewind / Undo Odometer Entry
  // Marks the entry as rewound (does NOT delete).
  // Recalculates current_odometer from remaining valid entries.
  // ==========================================
  async rewindOdometer(historyId, vehicleId) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is required for odometer rewind.");
    }

    // Mark entry as rewound
    const { error: markErr } = await supabase
      .from("odometer_history")
      .update({ is_rewound: true, rewound_at: new Date().toISOString() })
      .eq("id", historyId);
    if (markErr) throw markErr;

    // Find the latest non-rewound entry's odometer_value for this vehicle
    const { data: remaining, error: fetchErr } = await supabase
      .from("odometer_history")
      .select("odometer_value, previous_value")
      .eq("vehicle_id", vehicleId)
      .eq("is_rewound", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (fetchErr) throw fetchErr;

    let newCurrentOdo = 0;
    if (remaining && remaining.length > 0) {
      newCurrentOdo = remaining[0].odometer_value;
    } else {
      // All entries rewound — fall back to the previous_value of the oldest entry
      const { data: oldest } = await supabase
        .from("odometer_history")
        .select("previous_value")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: true })
        .limit(1);
      newCurrentOdo = oldest?.[0]?.previous_value || 0;
    }

    // Update the vehicle's current_odometer
    await supabase
      .from("vehicles")
      .update({
        current_odometer: newCurrentOdo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId);

    // Recalculate local cache
    let data = await this.getData();
    data.vehicles = recalculateVehicleMaintenance(
      data.vehicles,
      vehicleId,
      newCurrentOdo
    );
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Get Garage Members for a vehicle
  // ==========================================
  async getGarageMembers(vehicleId) {
    if (!isSupabaseConfigured() || !supabase) return [];
    try {
      const { data: memberRows } = await supabase
        .from("garage_members")
        .select("user_id, role, joined_at")
        .eq("vehicle_id", vehicleId);
      if (!memberRows || memberRows.length === 0) return [];

      const memberIds = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", memberIds);

      return (profiles || []).map((p) => {
        const row = memberRows.find((r) => r.user_id === p.id);
        return {
          user_id: p.id,
          display_name: p.display_name,
          role: row?.role || "member",
          joined_at: row?.joined_at,
        };
      });
    } catch (err) {
      console.error("[StorageService] getGarageMembers failed:", err.message);
      return [];
    }
  }

  // ==========================================
  // Invite Member by email
  // ==========================================
  async inviteMember(vehicleId, email) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is required for inviting members.");
    }

    // Look up the user by email via auth.users using profiles table
    // (profiles.id = auth.users.id, and we match by looking them up)
    const { data: { users }, error: lookupErr } = await supabase.auth.admin
      ? { data: { users: [] }, error: null }  // Skip admin API in browser
      : { data: { users: [] }, error: null };

    // Alternate approach: look up in profiles via a function or direct lookup
    // We use a workaround: try to get users from profiles where we store the email too
    // Since we don't store email in profiles, we'll use signInWithOtp or look in auth.users
    // Best non-admin approach: require the invited user to share their user_id or look by display hint
    // Practical approach for MVP: store email in profiles too
    
    // Check if profiles has an email field (added via our own registration)
    const { data: profileRows, error: profileErr } = await supabase
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", email); // fallback: search by name

    // Primary: try matching email stored during registration (we store it as email field)
    const { data: emailRows } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("email", email.toLowerCase().trim());

    const targetProfile = emailRows?.[0] || profileRows?.[0];

    if (!targetProfile) {
      throw new Error(
        `No user found with email "${email}". Ask them to register on NGINEBREAK first.`
      );
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("garage_members")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", targetProfile.id)
      .single();

    if (existing) {
      throw new Error(`${targetProfile.display_name} is already a member of this garage.`);
    }

    const { error: insertErr } = await supabase.from("garage_members").insert([
      {
        vehicle_id: vehicleId,
        user_id: targetProfile.id,
        role: "member",
      },
    ]);
    if (insertErr) throw insertErr;

    return { user_id: targetProfile.id, display_name: targetProfile.display_name, role: "member" };
  }

  // ==========================================
  // Complete Service
  // ==========================================
  async completeService(vehicleId, moduleId, currentOdometer, dateStr) {
    const odo = parseInt(currentOdometer);
    const historyId = uuidv4();

    let data = await this.getData();
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const mod = vehicle.maintenance_modules.find((m) => m.id === moduleId);
    if (!mod) throw new Error("Module not found");

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from("service_history").insert([
          {
            id: historyId,
            vehicle_id: vehicleId,
            module_id: moduleId,
            module_name: mod.name,
            odometer: odo,
            date: dateStr,
          },
        ]);

        await supabase
          .from("maintenance_modules")
          .update({ last_service_km: odo, last_service_date: dateStr })
          .eq("id", moduleId);
      } catch (err) {
        console.error("[StorageService] Supabase completeService failed:", err.message);
      }
    }

    vehicle.service_history.push({
      id: historyId,
      module_id: moduleId,
      module_name: mod.name,
      odometer: odo,
      date: dateStr,
      created_at: new Date().toISOString(),
    });

    mod.last_service_km = odo;
    mod.last_service_date = dateStr;

    data.vehicles = recalculateVehicleMaintenance(
      data.vehicles,
      vehicleId,
      vehicle.current_odometer
    );
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Vehicle Media (Photos & Invoices)
  // ==========================================
  async addVehicleMedia(vehicleId, mediaItem) {
    const data = await this.getData();
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    if (!vehicle.media) vehicle.media = [];
    vehicle.media.push(mediaItem);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from("vehicles")
          .update({ media: vehicle.media, updated_at: new Date().toISOString() })
          .eq("id", vehicleId);
      } catch (err) {
        console.error("[StorageService] Supabase media update error:", err.message);
      }
    }

    await this.saveData(data);
    return data;
  }

  async removeVehicleMedia(vehicleId, mediaId) {
    const data = await this.getData();
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    vehicle.media = (vehicle.media || []).filter((m) => m.id !== mediaId);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from("vehicles")
          .update({ media: vehicle.media, updated_at: new Date().toISOString() })
          .eq("id", vehicleId);
      } catch (err) {
        console.error("[StorageService] Supabase media remove error:", err.message);
      }
    }

    await this.saveData(data);
    return data;
  }
}

export default new StorageService();
