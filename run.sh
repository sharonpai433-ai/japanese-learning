#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if ! python3 -c "import flask" 2>/dev/null; then
  echo "Installing flask..."
  pip3 install -r requirements.txt
fi

(sleep 1.5 && open http://127.0.0.1:5050) &

python3 app.py
