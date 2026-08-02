interface WateringCanIconProps {
  size?: number;
  active?: boolean;
}

export const WateringCanIcon = ({ size = 17, active = false }: WateringCanIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9.5h8.5a3.5 3.5 0 0 1 3.5 3.5v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
    <path d="M9.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5" />
    <path d="M17 13h1.5a1.4 1.4 0 0 1 1.4 1.4V15" />
    <path d="M19.9 15a1.7 1.7 0 0 1-1.7 1.7" />
    <path d="M18.5 16.4v.7M19.5 16.5v.8" />
    {active && <path className="watering-can-flow" d="M20.6 18.2c.35.5.35.95 0 1.4" />}
  </svg>
);
