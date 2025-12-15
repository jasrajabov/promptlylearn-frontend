import { ProgressCircle, AbsoluteCenter } from "@chakra-ui/react";


interface ProgressCircleProps {
    size: "sm" | "md" | "lg" | "xl";
    value: number;
}

export const ProgressCircleComponent = ({ size, value }: ProgressCircleProps) => {
    return (

        <ProgressCircle.Root size={size} key={size} value={value} colorPalette="teal">
            <ProgressCircle.Circle>
                <ProgressCircle.Track />
                <ProgressCircle.Range />
            </ProgressCircle.Circle>
            <AbsoluteCenter>
                <ProgressCircle.ValueText />
            </AbsoluteCenter>
        </ProgressCircle.Root>
    )
};