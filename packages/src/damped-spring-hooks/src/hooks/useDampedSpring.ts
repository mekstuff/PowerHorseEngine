import Roact from "@rbxts/roact";
import SpringValueState from "../utils/SpringStateValue";
import { DampedSpringAnimator } from "@mekstuff-rbxts/damped-spring";

export type updateDampedSpring_Spring<T> = { target: T; angularFrequency?: number; dampingRatio?: number } | T;
type updateDampedSpring<T> = (spring: updateDampedSpring_Spring<T>) => void;

export default function useDampedSpring<T>(
	value: T,
	dampingRatio?: number,
	angularFrequency?: number,
): LuaTuple<[Roact.Binding<T>, updateDampedSpring<T>, SpringValueState<T>]> {
	const [SpringBinding, setSpringBinding] = Roact.useBinding<T>(value);
	const SpringValue = Roact.useMemo(() => {
		return new SpringValueState<T>(value);
	}, []);
	Roact.useEffect(() => {
		SpringValue.usePropertyEffect(() => {
			setSpringBinding(SpringValue.value);
		}, ["value"]);
		return () => {
			SpringValue.Destroy();
		};
	}, []);
	const updateDampedSpring = Roact.useCallback((updateSpring: updateDampedSpring_Spring<T>) => {
		const spring =
			typeIs(updateSpring, "table") && updateSpring["target"] !== undefined
				? updateSpring
				: {
						target: updateSpring,
						dampingRatio: dampingRatio,
						angularFrequency: angularFrequency,
				  };

		DampedSpringAnimator.animate(
			SpringValue,
			{
				value: spring.target,
			},
			{
				dampingRatio: spring.dampingRatio ?? dampingRatio,
				angularFrequency: spring.angularFrequency ?? angularFrequency,
			},
		);
	}, []);
	return $tuple(SpringBinding, updateDampedSpring, SpringValue);
}
