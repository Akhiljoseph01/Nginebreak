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
// Helper: get storage key scoped per user
// ============================================================
function getStorageKey(userId) {
  return userId ? `garage_data_${userId}` : "garage_data_guest";
}

// ============================================================
// Helper: get current auth user id + display name
// ============================================================
async function getCurrentAuthUser() {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return null;

    let displayName =
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Member";

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.display_name) {
        displayName = profile.display_name;
      }
    } catch (_) {}

    return {
      id: user.id,
      email: user.email,
      display_name: displayName,
    };
  } catch {
    return null;
  }
}

class StorageService {
  async init(storageKey = "garage_data_guest") {
    const data = await localforage.getItem(storageKey);
    if (!data) {
      await localforage.setItem(storageKey, DEFAULT_DATA);
    }
  }

  // ==========================================
  // Get Data — scoped to current user, resilient to missing tables
  // ==========================================
  async getData() {
    const authUser = await getCurrentAuthUser();
    const storageKey = getStorageKey(authUser?.id);
    await this.init(storageKey);

    let localData = await localforage.getItem(storageKey);
    if (!localData) {
      // Check legacy "garage_data" key for existing data migration
      const legacyData = await localforage.getItem("garage_data");
      if (legacyData?.vehicles?.length > 0) {
        localData = legacyData;
      } else {
        localData = {
          user: {
            name: authUser?.display_name || "Enthusiast",
            id: authUser?.id,
          },
          vehicles: [],
        };
      }
      await localforage.setItem(storageKey, localData);
    }

    // Guest / unauthenticated mode — use local storage directly
    if (!isSupabaseConfigured() || !supabase || !authUser) {
      return localData || DEFAULT_DATA;
    }

    try {
      // 1. Get vehicles this user is a member of (shared vehicles)
      let sharedVehicleIds = [];
      try {
        const { data: memberRows, error: memberErr } = await supabase
          .from("garage_members")
          .select("vehicle_id")
          .eq("user_id", authUser.id);
        if (!memberErr && memberRows) {
          sharedVehicleIds = memberRows.map((r) => r.vehicle_id).filter(Boolean);
        }
      } catch (_) {}

      // 2. Query vehicles: user's owned vehicles OR shared vehicles
      let vehiclesQuery = supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: true });

      if (sharedVehicleIds.length > 0) {
        vehiclesQuery = vehiclesQuery.or(
          `user_id.eq.${authUser.id},id.in.(${sharedVehicleIds.join(",")})`
        );
      } else {
        vehiclesQuery = vehiclesQuery.eq("user_id", authUser.id);
      }

      const { data: dbVehicles, error: vErr } = await vehiclesQuery;
      if (vErr) throw vErr;

      const validDbVehicles = dbVehicles || [];
      const vehIds = validDbVehicles.map((v) => v.id);

      // 3. Query maintenance modules for these vehicles
      let dbModules = [];
      if (vehIds.length > 0) {
        try {
          const { data: mods, error: mErr } = await supabase
            .from("maintenance_modules")
            .select("*")
            .in("vehicle_id", vehIds);
          if (!mErr && mods) dbModules = mods;
        } catch (_) {}
      }

      // 4. Query service history for these vehicles
      let dbHistory = [];
      if (vehIds.length > 0) {
        try {
          const { data: hist, error: hErr } = await supabase
            .from("service_history")
            .select("*")
            .in("vehicle_id", vehIds)
            .order("date", { ascending: false });
          if (!hErr && hist) dbHistory = hist;
        } catch (_) {}
      }

      // 5. Query members for these vehicles
      let allMemberRows = [];
      let allProfiles = [];
      if (vehIds.length > 0) {
        try {
          const { data: mRows } = await supabase
            .from("garage_members")
            .select("vehicle_id, user_id, role")
            .in("vehicle_id", vehIds);
          if (mRows) allMemberRows = mRows;

          const memberUserIds = [...new Set(allMemberRows.map((m) => m.user_id))];
          if (memberUserIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", memberUserIds);
            if (profs) allProfiles = profs;
          }
        } catch (_) {}
      }

      // 6. Assemble vehicles
      const assembledVehicles = validDbVehicles.map((veh) => {
        const rawModules = dbModules.filter((m) => m.vehicle_id === veh.id);
        const rawHistory = dbHistory.filter((h) => h.vehicle_id === veh.id);

        const modules = rawModules.map((mod) => {
          const calc = calculateMaintenanceStatus(
            mod,
            veh.current_odometer
          );
          return { ...mod, ...calc };
        });

        const vMembers = allMemberRows
          .filter((m) => m.vehicle_id === veh.id)
          .map((m) => {
            const p = allProfiles.find((pr) => pr.id === m.user_id);
            return {
              user_id: m.user_id,
              display_name:
                p?.display_name ||
                (m.user_id === authUser.id ? authUser.display_name : "Member"),
              role: m.role || "member",
            };
          });

        return {
          ...veh,
          media: veh.media || [],
          maintenance_modules: modules,
          service_history: rawHistory,
          members: vMembers,
        };
      });

      // 7. Prevent data loss: retain any local vehicles not yet in cloud, sync them
      if (localData?.vehicles && localData.vehicles.length > 0) {
        for (const locVeh of localData.vehicles) {
          const existsInCloud = assembledVehicles.some((v) => v.id === locVeh.id);
          if (!existsInCloud) {
            assembledVehicles.push(locVeh);
            // Sync to Supabase in background
            supabase
              .from("vehicles")
              .insert([
                {
                  id: locVeh.id,
                  user_id: authUser.id,
                  type: locVeh.type || "Car",
                  make: locVeh.make,
                  model: locVeh.model,
                  year: locVeh.year,
                  current_odometer: locVeh.current_odometer || 0,
                },
              ])
              .then(() => {
                supabase
                  .from("garage_members")
                  .insert([
                    {
                      vehicle_id: locVeh.id,
                      user_id: authUser.id,
                      role: "owner",
                    },
                  ])
                  .catch(() => {});
              })
              .catch(() => {});
          }
        }
      }

      const cloudData = {
        user: {
          name: authUser.display_name || "Enthusiast",
          id: authUser.id,
        },
        vehicles: assembledVehicles,
      };

      await localforage.setItem(storageKey, cloudData);
      await localforage.setItem("garage_data", cloudData);
      return cloudData;
    } catch (err) {
      console.warn(
        "[StorageService] Supabase sync failed, falling back to local cache:",
        err.message
      );
      return localData || DEFAULT_DATA;
    }
  }

  async saveData(data) {
    const authUser = await getCurrentAuthUser();
    const storageKey = getStorageKey(authUser?.id);
    await localforage.setItem(storageKey, data);
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
      user_id: authUser?.id || null,
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
        const { error: vInsertErr } = await supabase.from("vehicles").insert([
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
        if (vInsertErr) {
          console.error(
            "[StorageService] Supabase vehicle insert error:",
            vInsertErr.message
          );
        } else if (authUser) {
          try {
            await supabase.from("garage_members").insert([
              {
                vehicle_id: newVehicleId,
                user_id: authUser.id,
                role: "owner",
              },
            ]);
          } catch (gmErr) {
            console.warn(
              "[StorageService] garage_members insert warning:",
              gmErr.message
            );
          }

          if (newVehicle.current_odometer > 0) {
            try {
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
            } catch (odoErr) {
              console.warn(
                "[StorageService] odometer_history insert warning:",
                odoErr.message
              );
            }
          }
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
    let cloudMembers = [];
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: memberRows, error: mErr } = await supabase
          .from("garage_members")
          .select("user_id, role, joined_at")
          .eq("vehicle_id", vehicleId);
        if (!mErr && memberRows && memberRows.length > 0) {
          const memberIds = memberRows.map((r) => r.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", memberIds);

          cloudMembers = memberRows.map((row) => {
            const p = (profiles || []).find((pr) => pr.id === row.user_id);
            return {
              user_id: row.user_id,
              display_name: p?.display_name || "Member",
              role: row.role || "member",
              joined_at: row.joined_at,
            };
          });
        }
      } catch (_) {}
    }

    // Always merge with local vehicle.members so members are never lost
    const data = await this.getData();
    const vehicle = data?.vehicles?.find((v) => v.id === vehicleId);
    const localMembers = vehicle?.members || [];

    const merged = [...cloudMembers];
    for (const lm of localMembers) {
      if (
        !merged.some(
          (m) =>
            m.user_id === lm.user_id ||
            (m.email && lm.email && m.email.toLowerCase() === lm.email.toLowerCase())
        )
      ) {
        merged.push(lm);
      }
    }

    return merged;
  }

  // ==========================================
  // Invite Member by email
  // ==========================================
  async inviteMember(vehicleId, email) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is required for inviting members.");
    }

    const cleanEmail = email.toLowerCase().trim();
    let targetProfile = null;

    // 1. Try RPC lookup first (bypasses missing profile issues and queries auth.users via SECURITY DEFINER)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "lookup_user_by_email",
        { lookup_email: cleanEmail }
      );
      if (!rpcErr && rpcData && rpcData.length > 0) {
        targetProfile = rpcData[0];
      }
    } catch (_) {}

    // 2. Fallback: query profiles directly (case-insensitive on email or display_name)
    if (!targetProfile) {
      try {
        const { data: emailRows } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .ilike("email", cleanEmail);

        if (emailRows && emailRows.length > 0) {
          targetProfile = emailRows[0];
        } else {
          // Check by display name or prefix fallback
          const { data: nameRows } = await supabase
            .from("profiles")
            .select("id, display_name, email")
            .ilike("display_name", cleanEmail);
          if (nameRows && nameRows.length > 0) {
            targetProfile = nameRows[0];
          }
        }
      } catch (profErr) {
        console.warn("[StorageService] Profile lookup warning:", profErr.message);
      }
    }

    // 3. Fallback: verify if email is registered in Supabase Auth directly
    if (!targetProfile) {
      try {
        const { error: authCheckErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: "VerifyUserExistsPass_" + Math.random().toString(36),
        });
        if (authCheckErr?.message?.toLowerCase().includes("already registered")) {
          // The user is definitely registered in Supabase Auth!
          targetProfile = {
            id: "user_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_"),
            display_name: cleanEmail.split("@")[0],
            email: cleanEmail,
          };
        }
      } catch (_) {}
    }

    if (!targetProfile) {
      throw new Error(
        `No user found with email "${email}". Ask them to register on NGINEBREAK first.`
      );
    }

    // Check if already a member locally or in cloud
    let isAlreadyMember = false;
    try {
      const { data: existing } = await supabase
        .from("garage_members")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .eq("user_id", targetProfile.id)
        .maybeSingle();
      if (existing) isAlreadyMember = true;
    } catch (_) {}

    const data = await this.getData();
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    if (!vehicle.members) vehicle.members = [];
    if (
      isAlreadyMember ||
      vehicle.members.some(
        (m) =>
          m.user_id === targetProfile.id ||
          (m.email && m.email.toLowerCase() === cleanEmail) ||
          m.display_name?.toLowerCase() === cleanEmail.toLowerCase()
      )
    ) {
      throw new Error(
        `${targetProfile.display_name || "This user"} is already a member of this garage.`
      );
    }

    // Try saving to garage_members in Supabase if table exists
    try {
      await supabase.from("garage_members").insert([
        {
          vehicle_id: vehicleId,
          user_id: targetProfile.id,
          role: "member",
        },
      ]);
    } catch (insertErr) {
      console.warn(
        "[StorageService] garage_members table insert warning (using local sync):",
        insertErr.message
      );
    }

    const newMemberItem = {
      user_id: targetProfile.id,
      display_name: targetProfile.display_name,
      email: cleanEmail,
      role: "member",
      joined_at: new Date().toISOString(),
    };

    vehicle.members.push(newMemberItem);
    await this.saveData(data);

    return newMemberItem;
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
