# ============================================================================
# Archivo: app.py (VERSIÓN PRODUCCIÓN - RAILWAY READY)
# ============================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.tree import DecisionTreeClassifier
import os  # <--- SE AGREGÓ: Necesario para leer el puerto de Railway

app = Flask(__name__)
CORS(app)

# 1. ENTRENAMIENTO (0-6 Genin | 7-10 Chunin | 11-13 Jonin)
X_train = np.array([[i] for i in range(14)])
y_train = np.array([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2])

modelo_ia = DecisionTreeClassifier()
modelo_ia.fit(X_train, y_train)

print("✅ Motor de IA Recalibrado y desplegado en Railway.")

@app.route('/api/ia/recomendar-ruta', methods=['POST'])
def recomendar_ruta():
    try:
        datos = request.get_json()
        # El backend de Node debe enviar {"puntaje": X}
        puntaje_original = float(datos.get('puntaje', 0))

        # 🛡️ VALIDACIÓN DE INGENIERÍA (Anti-Extrapolación)
        if puntaje_original > 13:
            print(f"⚠️ ALERTA: Puntaje fuera de rango ({puntaje_original}). Forzando a Genin.")
            puntaje_validado = 0
        else:
            puntaje_validado = puntaje_original

        # Predicción
        prediccion = int(modelo_ia.predict([[puntaje_validado]])[0])

        print(f"📊 Puntaje Recibido: {puntaje_original} | Nivel Asignado: {prediccion}")

        return jsonify({
            "nivel_id": prediccion,
            "puntaje_recibido": puntaje_original,
            "mensaje": "Clasificación exitosa"
        }), 200

    except Exception as e:
        print("🚨 Error en IA:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # AJUSTE VITAL: Railway asigna un puerto dinámico. 
    # host='0.0.0.0' permite que el Backend de Node encuentre a la IA.
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)