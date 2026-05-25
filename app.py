import io
import json
import socket
from pathlib import Path
from flask import Flask, render_template, jsonify, abort, send_file

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

app = Flask(__name__)


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/flashcard")
def flashcard():
    return render_template("flashcard.html")


@app.route("/quiz")
def quiz():
    return render_template("quiz.html")


@app.route("/listening")
def listening():
    return render_template("listening.html")


@app.route("/exam")
def exam():
    return render_template("exam.html")


@app.route("/sentence")
def sentence():
    return render_template("sentence.html")


@app.route("/journey")
def journey():
    return render_template("journey.html")


@app.route("/stats")
def stats():
    return render_template("stats.html")


@app.route("/api/vocab/<level>")
def api_vocab(level):
    allowed = {"beginner", "n5", "n4"}
    if level not in allowed:
        abort(404)
    data = load_json(f"vocab_{level}.json")
    if data is None:
        abort(404)
    return jsonify(data)


@app.route("/api/vocab/all")
def api_vocab_all():
    result = {}
    for level in ["beginner", "n5", "n4"]:
        data = load_json(f"vocab_{level}.json")
        if data is not None:
            result[level] = data
    return jsonify(result)


@app.route("/connect")
def connect():
    ip = get_local_ip()
    url = f"http://{ip}:5050"
    return render_template("connect.html", lan_url=url, lan_ip=ip)


@app.route("/api/qr.svg")
def api_qr():
    import qrcode
    import qrcode.image.svg
    ip = get_local_ip()
    url = f"http://{ip}:5050"
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(url, image_factory=factory, box_size=10)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    return send_file(buf, mimetype="image/svg+xml")


@app.route("/api/sentences")
def api_sentences():
    data = load_json("sentences.json")
    if data is None:
        abort(404)
    return jsonify(data)


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5050))
    local_ip = get_local_ip()
    print("")
    print("  日文學習工具已啟動 ✨")
    print(f"  電腦：http://127.0.0.1:{port}")
    print(f"  手機（同 Wi-Fi）：http://{local_ip}:{port}")
    print(f"  掃描 QR Code：http://{local_ip}:{port}/connect")
    print("")
    app.run(host="0.0.0.0", port=port, debug=False)
