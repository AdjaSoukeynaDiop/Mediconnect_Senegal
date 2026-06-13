// Aucun import nécessaire — composant pur sans dépendances externes
const Icon = ({ d, size = 20, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export default Icon;
