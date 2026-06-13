// Aucun import nécessaire — composant SVG pur
const ECGLine = ({ width = 300, color = "#14a896", opacity = 0.4 }) => (
  <svg width={width} height={40} viewBox={`0 0 ${width} 40`} style={{ overflow: "visible" }}>
    <polyline
      points={`0,20 20,20 40,5 50,35 60,20 90,20 110,5 120,35 130,20 160,20 180,5 190,35 200,20 230,20 250,5 260,35 270,20 ${width},20`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={opacity}
    />
  </svg>
);

export default ECGLine;
