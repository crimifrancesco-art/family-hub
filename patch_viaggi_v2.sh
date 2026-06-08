#!/bin/bash
FILE="src/pages/ViaggiPage.jsx"
[ ! -f "$FILE" ] && { echo "❌ File non trovato"; exit 1; }
cp "$FILE" "${FILE}.bak2"

# ── 1. Aggiungi funzione statusStyle() se non esiste ──────────────────────
if ! grep -q "function statusStyle" "$FILE"; then
perl -i -0pe '
s/(function labelStatus\(value\)[^\n]*\n)/
$1
function statusStyle(status) {
  const map = {
    planning:  { bg: "#eff6ff", border: "#bfdbfe", badge: "#3b82f6", label: "Pianificato", icon: "📋" },
    incoming:  { bg: "#f0fdf4", border: "#bbf7d0", badge: "#10b981", label: "In arrivo",   icon: "🎒" },
    ongoing:   { bg: "#fef9c3", border: "#fde68a", badge: "#f59e0b", label: "In corso",    icon: "✈️" },
    done:      { bg: "#f5f5f5", border: "#e0e0e0", badge: "#9ca3af", label: "Concluso",    icon: "🏁" },
    cancelled: { bg: "#fff1f2", border: "#fecdd3", badge: "#ef4444", label: "Annullato",   icon: "❌" },
  }
  return map[status] || map.planning
}

/s
' "$FILE"
  echo "✅ Aggiunta statusStyle()"
fi

echo "✅ Patch ViaggiPage applicata"
echo "🔔 La funzione di modifica Diario va aggiunta manualmente nel modal diario (vedi istruzioni)"
