--[[
  CCO Client — Roblox Studio (Luau)
  Syncs a Custom Client Object to your Replit CCO API.

  HOW TO USE:
  1. Place this LocalScript inside StarterPlayerScripts (or a Script in ServerScriptService).
  2. Replace REPLIT_API_URL with your actual Replit domain.
  3. Store your API key in a StringValue inside the script or load it from a RemoteEvent/DataStore.
  4. Never paste your API key directly into a public GitHub repo — use Roblox's SecretService
     or pass it from the server side only.
--]]

local HttpService   = game:GetService("HttpService")
local Players       = game:GetService("Players")
local RunService    = game:GetService("RunService")

-- ─────────────────────────────────────────────────────────────────────────────
-- CONFIG
-- ─────────────────────────────────────────────────────────────────────────────
local REPLIT_API_URL = "https://ed8fa166-d518-4e34-b0f9-6d88f9414eba-00-22f7ozmjdx638.riker.replit.dev/api"
local API_KEY        = "YOUR_CCO_API_KEY"   -- Replace with your actual key (server-side only!)
local SYNC_INTERVAL  = 1                     -- seconds between updates
local PLAYER_ID      = "player_" .. (Players.LocalPlayer and Players.LocalPlayer.UserId or "server")

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPERS
-- ─────────────────────────────────────────────────────────────────────────────

local function vec3ToTable(v: Vector3)
	return { x = math.round(v.X * 100) / 100,
	         y = math.round(v.Y * 100) / 100,
	         z = math.round(v.Z * 100) / 100 }
end

local function getCharacterState(character): string
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return "unknown" end
	local state = humanoid:GetState()
	local stateMap = {
		[Enum.HumanoidStateType.Running]    = "walking",
		[Enum.HumanoidStateType.Jumping]    = "jumping",
		[Enum.HumanoidStateType.Freefall]   = "falling",
		[Enum.HumanoidStateType.Swimming]   = "swimming",
		[Enum.HumanoidStateType.Sitting]    = "sitting",
		[Enum.HumanoidStateType.Dead]       = "dead",
		[Enum.HumanoidStateType.Landed]     = "idle",
	}
	return stateMap[state] or "idle"
end

-- ─────────────────────────────────────────────────────────────────────────────
-- POST — send CCO data to the server
-- ─────────────────────────────────────────────────────────────────────────────
local function pushCCO(id: string, payload: table)
	local url = REPLIT_API_URL .. "/cco/" .. id
	local ok, result = pcall(function()
		return HttpService:RequestAsync({
			Url     = url,
			Method  = "POST",
			Headers = {
				["Content-Type"] = "application/json",
				["X-Api-Key"]    = API_KEY,
			},
			Body = HttpService:JSONEncode(payload),
		})
	end)
	if not ok then
		warn("[CCO] POST failed:", result)
	elseif result.StatusCode ~= 200 then
		warn("[CCO] Server returned", result.StatusCode, result.Body)
	end
end

-- ─────────────────────────────────────────────────────────────────────────────
-- GET — fetch a CCO by id
-- ─────────────────────────────────────────────────────────────────────────────
local function fetchCCO(id: string): table?
	local url = REPLIT_API_URL .. "/cco/" .. id
	local ok, result = pcall(function()
		return HttpService:RequestAsync({
			Url    = url,
			Method = "GET",
			Headers = { ["Content-Type"] = "application/json" },
		})
	end)
	if not ok or result.StatusCode ~= 200 then
		warn("[CCO] GET failed for", id)
		return nil
	end
	local decoded = HttpService:JSONDecode(result.Body)
	return decoded
end

-- ─────────────────────────────────────────────────────────────────────────────
-- MAIN LOOP — sync local player every SYNC_INTERVAL seconds
-- ─────────────────────────────────────────────────────────────────────────────
local player    = Players.LocalPlayer
local lastSync  = 0

RunService.Heartbeat:Connect(function()
	local now = tick()
	if now - lastSync < SYNC_INTERVAL then return end
	lastSync = now

	local character = player and player.Character
	if not character then return end

	local rootPart = character:FindFirstChild("HumanoidRootPart")
	if not rootPart then return end

	local humanoid = character:FindFirstChildOfClass("Humanoid")

	local payload = {
		position = vec3ToTable(rootPart.Position),
		rotation = vec3ToTable(rootPart.Orientation),
		state    = getCharacterState(character),
		data = {
			health    = humanoid and math.floor(humanoid.Health) or 0,
			maxHealth = humanoid and math.floor(humanoid.MaxHealth) or 100,
			name      = player.Name,
			userId    = player.UserId,
		},
	}

	-- Fire and forget — don't block the game loop
	task.spawn(pushCCO, PLAYER_ID, payload)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- EXAMPLE: read another CCO (e.g. an NPC or world object) on demand
-- ─────────────────────────────────────────────────────────────────────────────
task.delay(5, function()
	local data = fetchCCO("npc_boss")
	if data then
		print("[CCO] Boss position:", data.position.x, data.position.y, data.position.z)
		print("[CCO] Boss state:", data.state)
	end
end)
