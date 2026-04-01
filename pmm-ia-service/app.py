# ============================================================================
# Archivo: app.py (VERSIÓN BLINDADA - DEBUG MODE)
# ============================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.tree import DecisionTreeClassifier

app = Flask(__name__)
CORS(app)

# 1. ENTRENAMIENTO (0-6 Genin | 7-10 Chunin | 11-13 Jonin)
X_train = np.array([[i] for i in range(14)])
y_train = np.array([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2])

modelo_ia = DecisionTreeClassifier()
modelo_ia.fit(X_train, y_train)

print("✅ Motor de IA Recalibrado y Blindado.")

@app.route('/api/ia/recomendar-ruta', methods=['POST'])
def recomendar_ruta():
    try:
        datos = request.get_json()
        puntaje_original = float(datos.get('puntaje', 0))

        # 🛡️ VALIDACIÓN DE INGENIERÍA (Anti-Extrapolación)
        # Si recibimos un ID (ej: 38) en vez de un puntaje (0-13), 
        # lo marcamos como 0 para que no asigne Jonin por error.
        if puntaje_original > 13:
            print(f"⚠️ ALERTA: Recibido puntaje fuera de rango ({puntaje_original}). Forzando a Genin.")
            puntaje_validado = 0
        else:
            puntaje_validado = puntaje_original

        # Predicción
        prediccion = int(modelo_ia.predict([[puntaje_validado]])[0])

        # Log en consola para que veas qué está pasando en tiempo real
        print(f"📊 Puntaje: {puntaje_original} | Nivel Asignado: {prediccion}")

        return jsonify({
            "nivel_id": prediccion,
            "puntaje_recibido": puntaje_original,
            "mensaje": "Clasificación exitosa" if puntaje_original <= 13 else "Error: Dato fuera de rango detectado"
        }), 200

    except Exception as e:
        print("🚨 Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)