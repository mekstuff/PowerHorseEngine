const CONSTS = {
	VehicleDefaults: {
		MaxSpeed: 25,
		Torque: 6,
		ThrottleFloat: 0,
		TurnSpeed: 0.6,
		MaxSteerAngle: 35,
		SteerFloat: 0,
		Steerable: true,
		SteerAngle: 0,
		SteerInversed: false,
		Spring: false,
		SpringLimitsEnabled: false,
		SpringDamping: 15,
		// SpringDamping: 200,
		SpringMinLength: 0,
		SpringMaxLength: 2,
		SpringFreeLength: 2,
		SpringMaxForce: math.huge,
		SpringStiffness: 25,
		// SpringStiffness: 5000,
		CylindricalLimitsEnabled: true,
		CylindricalLowerLimit: -1,
		CylindricalUpperLimit: -4,
		CylindricalAngularVelocity: 0,
		CylindricalMaxAngularAcceleration: 500000,
		CylindricalMaxTorque: 1000,
		Attachment0OrientationSpeed: 0.4,
		WheelSize: new Vector3(2, 2, 2),
		WheelsVisible: true,
		WheelsMotor: true,
		WheelsPhysicalProperties: new PhysicalProperties(0.7, 1, 0.5, 1, 1),
	},
};

export default CONSTS;
