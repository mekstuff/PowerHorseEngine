import VehicleChassisRig, { VehicleModelInfo, RigFromModel, AutoRigVehicleModel } from "./VehicleChassisRig";
import VehicleChassisRigWheel from "./VehicleChassisRigWheel";
import VehicleChassisRigSpringModifier from "./VehicleChassisRigSpringModifier";

declare global {
	namespace PHe {
		interface Pseudos {
			VehicleChassisRig: VehicleChassisRig;
		}
		interface CreateablePseudos {
			VehicleChassisRig: VehicleChassisRig;
		}
	}
}

export {
	VehicleChassisRig,
	VehicleModelInfo,
	VehicleChassisRigWheel,
	VehicleChassisRigSpringModifier,
	RigFromModel,
	AutoRigVehicleModel,
};
