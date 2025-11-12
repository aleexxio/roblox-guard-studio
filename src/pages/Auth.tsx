import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately to home
    navigate("/");
  }, [navigate]);

  return null;
}
