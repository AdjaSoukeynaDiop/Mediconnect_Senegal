import { useNavigate } from "react-router-dom";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import Btn  from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: C.bg, gap: "1.1rem", textAlign: "center", padding: "2rem",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: `${C.danger}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon d={I.shield} size={32} stroke={C.danger} sw={1.5} />
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, fontFamily: F.title }}>
        Accès non autorisé
      </div>
      <div style={{ fontSize: "0.88rem", color: C.textLight, maxWidth: 400, lineHeight: 1.6 }}>
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
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

export default UnauthorizedPage;
