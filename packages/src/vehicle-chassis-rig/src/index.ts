import VehicleChassisRig, { VehicleModelInfo } from "./VehicleChassisRig";
import VehicleChassisRigWheel from "./VehicleChassisRigWheel";

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

export { VehicleChassisRig, VehicleModelInfo, VehicleChassisRigWheel };
