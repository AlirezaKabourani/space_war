# Phase 09D-1B admin access and exact ownership

## Existing gate inspected

The profile-management/selection list is `renderProfileManager` inside App. Its existing admin branch depends on the current `profileState`/`activeProfile.role`. `handleAdminLogin` calls the existing credential-checked `selectProfile` and rejects an unchanged state on failure. `loadProfileState` deliberately refuses to restore admin access after reload. Player profile selection and profile creation switch to a player and use the current profile state. These are the actual existing interface gates, not button-label assumptions.

The dashboard remains exclusively inside this admin profile-management flow. It does not add a public profile-picker report route, modify profile selection, or pass a false owner ID to the existing owner-only repository functions.

## Read session

Only after a successful existing `handleAdminLogin`, App creates a `CognitiveAdminReadAccess` handle associated in a WeakMap with a callback to its live profile-state ref. No handle is created on failed login or restored from storage. Creating/selecting a player explicitly revokes the handle and clears the selected dashboard target. Re-login revokes the previous handle before replacing it.

The repository validates on every relevant boundary:

1. The exact handle is a live registered session, not an object merely claiming an admin role.
2. Its current live App profile is an existing admin and the persisted active profile ID still agrees.
3. The exact target profile ID exists in both the live profile list and the current normalized profile storage.
4. After database enumeration/opening, request completion and transaction completion, the same checks run again.
5. Each returned record passes the unchanged nested schema/model-stamp validator and belongs to the exact target. Scoped list output is filtered only by the requested released scenario after validating all returned owner rows.

No profile name, timestamp, scientific run ID, seed, legacy event envelope or snapshot is used to establish ownership. Two owners with the same name keep separate records. A missing/deleted owner produces `OwnerMissing`; it is not treated as an empty valid archive or attached to another profile.

## APIs and unchanged write boundary

`listCognitiveRunsForAdmin(targetProfileId, scenarioId, access)` reads only one explicit owner and scenario, using the owner index, and returns validated records in descending ISO/UUID order.

`readCognitiveRunForAdmin(recordId, targetProfileId, access)` requires the returned row's owner to match that explicit target and validates all stored scenario/version metadata. A missing record is null; a wrong owner is an error. There is no all-record dump, list-all, admin mutation or delete API.

The existing `listCognitiveRuns(profileId, scenarioId, currentProfileId)` and `readCognitiveRun(recordId, currentProfileId)` are untouched. The UI imports only the new scoped admin list. The original write path and insert-if-absent implementation remain unchanged, as do archive configuration, completion adapters, payload schema, event logging, exporters, backup and reset. Archive OFF continues to permit reading old records.

Admin reads are IndexedDB `readonly` transactions. Before opening, database enumeration checks whether the archive exists. Absence returns an actual empty list/null without creating a database. An unexpected upgrade is aborted rather than creating or migrating a schema. If safe enumeration is unavailable, a visible unavailable status is returned. The report never enables either recording control.

## Request and UI isolation

The dashboard's loaded state is keyed by target ID and access-handle identity. Changing either immediately excludes previous state from rendering. Effects cancel stale commits, and the repository rechecks the live gate after asynchronous boundaries. Render also checks the gate, so a prior successful read cannot keep showing report data after permission loss. Storage/session changes re-evaluate the view. The target name is rendered only after access succeeds.

Opening/closing the dashboard does not change the active profile, log an interaction, touch game state, persist UI selections, or write to storage. Heading focus and return-to-trigger focus are keyboard navigation only. Refresh goes back through the existing nonadmin startup flow. A URL query does not open the dashboard.

## Evidence and limitations

The real browser suite covers actual password login, per-row actions, owner-specific reads, forged/null/revoked session denial, exact record-owner mismatch, duplicate display names, unavailable/corrupt/read-restricted IndexedDB, a removed existing owner, target change during pending reads, and actual profile switch while an admin read is pending. It verifies zero dashboard writes/telemetry and unchanged stored scientific records. Direct component props without a valid session are also denied in SSR and a browser fixture.

This remains client-side, interface-level gating. It is not authenticated server authorization, encryption, confidentiality against same-origin JavaScript, or a cross-device identity system. Someone controlling the client can change its code/storage. The UI and documentation state these limits. No server, network result persistence, synchronization, migration or new backup integration is added.
