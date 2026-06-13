import { useNavigate } from "react-router-dom";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import Btn  from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: C.bg, gap: "1.1rem", textAlign: "center", padding: "2rem",
    }}>
      <div style={{
        fontSize: "6rem", fontWeight: 900, lineHeight: 1,
        color: C.borderLight, fontFamily: F.title,
        letterSpacing: "-2px",
      }}>
        404
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, fontFamily: F.title }}>
        Page introuvable
      </div>
      <div style={{ fontSize: "0.88rem", color: C.textLight, maxWidth: 360, lineHeight: 1.6 }}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <Btn variant="outline" onClick={() => navigate(-1)} icon={I.arrowL}>
          Retour
        </Btn>
        <Btn onClick={() => navigate("/")} icon={I.arrowR}>
          Accueil
        </Btn>
      </div>
    </div>
  );
};

export default NotFoundPage;
