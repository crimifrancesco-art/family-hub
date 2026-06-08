#!/bin/bash
# Esegui nella root del progetto: bash fix_dates_viaggi.sh

FILE="src/pages/ViaggiPage.jsx"

if [ ! -f "$FILE" ]; then
  echo "❌ File $FILE non trovato. Sei nella root del progetto?"
  exit 1
fi

# Backup
cp "$FILE" "${FILE}.bak"
echo "✅ Backup creato: ${FILE}.bak"

# 1. Aggiungi funzione fmt() subito dopo le import (prima riga con "function labelStatus")
# Controlla se fmt è già presente
if grep -q "function fmt(" "$FILE"; then
  echo "ℹ️  fmt() già presente, skip."
else
  # Inserisci fmt() prima di "function labelStatus"
  sed -i 's/function labelStatus(value)/function fmt(iso) {\n  if (!iso) return \x27\xe2\x80\x94\x27\n  const parts = (iso || \x27\x27).split(\x27-\x27)\n  if (parts.length < 3) return iso\n  return `${parts[2]}\/${parts[1]}\/${parts[0]}`\n}\n\nfunction labelStatus(value)/' "$FILE"
  echo "✅ Aggiunta funzione fmt()"
fi

# 2. Sostituisci display date (pattern JSX di visualizzazione, non input value=)
# Usiamo perl per sicurezza con i pattern negativi (non toccare value={...})

perl -i -pe '
  # Non toccare le righe con value= o .localeCompare o replaceAll o googleCalendarLink
  unless (/value=\{|\.localeCompare|replaceAll|googleCalendarLink|startDate:|endDate:/) {
    s/\{trip\.dateFrom\}/{fmt(trip.dateFrom)}/g;
    s/\{trip\.dateTo\}/{fmt(trip.dateTo)}/g;
    s/\{flight\.date\}/{fmt(flight.date)}/g;
    s/\{hotel\.checkIn\}/{fmt(hotel.checkIn)}/g;
    s/\{hotel\.checkOut\}/{fmt(hotel.checkOut)}/g;
    s/\{hotel\.cancellationDate\}/{fmt(hotel.cancellationDate)}/g;
    s/\{deadline\.date\}/{fmt(deadline.date)}/g;
    s/\{d\.date\}/{fmt(d.date)}/g;
    s/\{item\.dateFrom\}/{fmt(item.dateFrom)}/g;
    s/\{item\.dateTo\}/{fmt(item.dateTo)}/g;
    s/\{item\.pickupDate\}/{fmt(item.pickupDate)}/g;
    s/\{item\.dropoffDate\}/{fmt(item.dropoffDate)}/g;
    s/\{day\.date\}/{fmt(day.date)}/g;
    s/\{park\.dateFrom\}/{fmt(park.dateFrom)}/g;
    s/\{park\.dateTo\}/{fmt(park.dateTo)}/g;
    s/\{car\.pickupDate\}/{fmt(car.pickupDate)}/g;
    s/\{car\.dropoffDate\}/{fmt(car.dropoffDate)}/g;
  }
' "$FILE"

echo "✅ Date convertite in formato gg/mm/aaaa"
echo ""
echo "Verifica:"
grep -n "fmt(" "$FILE" | head -20
