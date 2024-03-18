--[[
    This LuaRuntime assumes the following ReplicatedStorage setup:
        ReplicatedStorage/
            node_modules
                (node_modules synced)

    The following packages must be installed for this runtime to work:
        rbxts-lua-provider
        @mekstuff-rbxts/core (should be already installed from vehicle-chassis-rig)
        @mekstuff-rbxts/servant (should be already installed from vehicle-chassis-rig)
]]
local RS = game:GetService("ReplicatedStorage");
local node_modules = RS:WaitForChild("node_modules");
local LuaProvider = require(node_modules:WaitForChild("rbxts-lua-provider"):WaitForChild("Provider"))
local _core = LuaProvider.require(node_modules:WaitForChild("@mekstuff-rbxts"):WaitForChild("core"):WaitForChild("out"));
local Serializer = LuaProvider.require(node_modules:WaitForChild("@mekstuff-rbxts"):WaitForChild("serializer"):WaitForChild("out")).Serializer;
-- Compiled with roblox-ts v2.1.0
local Pseudo = _core.Pseudo
local Servant = _core.Servant
local TweenService = game:GetService("TweenService")
local _class
do
	local super = Pseudo
	local VehicleChassisRigClientProxy = setmetatable({}, {
		__tostring = function()
			return "VehicleChassisRigClientProxy"
		end,
		__index = super,
	})
	VehicleChassisRigClientProxy.__index = VehicleChassisRigClientProxy
	function VehicleChassisRigClientProxy.new(...)
		local self = setmetatable({}, VehicleChassisRigClientProxy)
		return self:constructor(...) or self
	end
	function VehicleChassisRigClientProxy:constructor()
		super.constructor(self, "VehicleChassisRig")
		self.SteerFloat = 0
		self.ThrottleFloat = 0
		self.MaxSteerAngleDecay = 0
		self.ReverseTorque = nil
		self.Torque = 0
		self.ReverseMaxSpeed = nil
		self.MaxSpeed = 0
		self.MaxSteerAngle = 0
		self.TurnSpeed = 0
		self._AssemblyLinearVelocityMagnitude = 0
		self:GetRef().Name = "VehicleChassisRigClientProxy"
		local RigServant = Servant.new()
		self._dev.RigServant = RigServant
		RigServant.Parent = self:GetRef()
		if script.Name == "__" then
			self:Destroy()
			RigServant:Destroy()
			task.wait(0.1)
			script:Destroy()
			return nil
		end
		RigServant:Keep(script:GetPropertyChangedSignal("Name"):Connect(function()
			self:Destroy()
			RigServant:Destroy()
			task.wait(0.1)
			script:Destroy()
		end))
		local NOESerializer = RigServant:Keep(Serializer.new(self.ClassName .. "NetworkOwnership"))
		local _v = script:WaitForChild("_v")
		local _upd = script:WaitForChild("_upd")
		local Data = NOESerializer:Decode(_v.Value)
		self.ThrottleFloat = Data.vehicleSeat.ThrottleFloat
		self.SteerFloat = Data.vehicleSeat.SteerFloat
		RigServant:Keep(Data.vehicleSeat:GetPropertyChangedSignal("ThrottleFloat"):Connect(function()
			self.ThrottleFloat = Data.vehicleSeat.ThrottleFloat
		end))
		RigServant:Keep(Data.vehicleSeat:GetPropertyChangedSignal("SteerFloat"):Connect(function()
			self.SteerFloat = Data.vehicleSeat.SteerFloat
		end))
		RigServant:Keep(game:GetService("RunService").RenderStepped:Connect(function()
			self._AssemblyLinearVelocityMagnitude = Data.vehicleSeat.AssemblyLinearVelocity.Magnitude
		end))
		local update_upd = function()
			local _updData = NOESerializer:Decode(_upd.Value)
			for key, value in pairs(_updData) do
				self[key] = value
			end
		end
		update_upd()
		RigServant:Keep(_upd:GetPropertyChangedSignal("Value"):Connect(function()
			update_upd()
		end))
		self:usePropertyEffect(function()
			local SteerAngle = self.SteerFloat * (self.MaxSteerAngle - self.MaxSteerAngleDecay * self._AssemblyLinearVelocityMagnitude)
			local _steer = Data.steer
			local _arg0 = function(steer)
				if not steer or not steer.Attachment0 then
					return nil
				end
				local targetY = -SteerAngle * (if steer.SteerInversed then -1 else 1)
				TweenService:Create(steer.Attachment0, TweenInfo.new(self.TurnSpeed), {
					Orientation = Vector3.new(0, targetY, 90),
				}):Play()
			end
			for _k, _v_1 in _steer do
				_arg0(_v_1, _k - 1, _steer)
			end
		end, { "SteerFloat", "MaxSteerAngle", "_AssemblyLinearVelocityMagnitude" })
		self:usePropertyEffect(function()
			local _wheels = Data.wheels
			local _arg0 = function(wheel)
				local WheelCylindrical = wheel:FindFirstChildWhichIsA("CylindricalConstraint")
				if not WheelCylindrical then
					return nil
				end
				local _targetMaxSpeed = if self.ReverseMaxSpeed ~= nil then if self.ThrottleFloat == -1 then self.ReverseMaxSpeed else self.MaxSpeed else self.MaxSpeed
				local _targetTorque = if self.ReverseTorque ~= nil then if self.ThrottleFloat == -1 then self.ReverseTorque else self.Torque else self.Torque
				WheelCylindrical.AngularVelocity = (_targetMaxSpeed / (Data.wheelZSize * 0.5)) * self.ThrottleFloat
				WheelCylindrical.MotorMaxTorque = (_targetTorque * 1000) / #Data.wheels
			end
			for _k, _v_1 in _wheels do
				_arg0(_v_1, _k - 1, _wheels)
			end
		end, { "ThrottleFloat", "Torque", "MaxSpeed", "ReverseMaxSpeed", "ReverseTorque" })
		self:GetRef().Parent = Data.rig
	end
	_class = VehicleChassisRigClientProxy
end
_class.new()
local _ = Serializer
