using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System;
using System.Text;

[Serializable]
public class IARequest
{
    public string message;
}

public class IA_Manager : MonoBehaviour
{
    // Usaremos el nuevo endpoint que acabamos de crear en Express para streaming de texto
    private string apiUrl = "http://apiia-ia-lutnid-7381ae-157-254-174-229.traefik.me/api/ask/stream";

    public void AskIA(string userMessage, Action<string> onUpdate, Action onComplete, Action<string> onError)
    {
        StartCoroutine(SendStreamRequestCoroutine(userMessage, onUpdate, onComplete, onError));
    }

    private IEnumerator SendStreamRequestCoroutine(string message, Action<string> onUpdate, Action onComplete, Action<string> onError)
    {
        IARequest requestData = new IARequest { message = message };
        string jsonData = JsonUtility.ToJson(requestData);

        using (UnityWebRequest request = new UnityWebRequest(apiUrl, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            // Comenzar de manera asíncrona la petición
            var operation = request.SendWebRequest();

            int lastLength = 0;
            
            // Ciclo loop por cada frame de Unity mientras la petición siga su curso (generando respuestas por la IA)
            while (!operation.isDone)
            {
                string currentText = request.downloadHandler.text;
                // Si la longitud del stream aumentó, significa que recibimos una palabra interactiva
                if (!string.IsNullOrEmpty(currentText) && currentText.Length > lastLength)
                {
                    lastLength = currentText.Length;
                    onUpdate?.Invoke(currentText); // Enviar el texto incompleto actualizado al UI
                }
                
                yield return null; // Pausa esta corrutina hasta el siguiente Frame del motor
            }

            // Una vez descargado todo el contenido / al terminar de streamear la IA
            if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
            {
                onError?.Invoke($"Error HttP: {request.error} | Response: {request.downloadHandler.text}");
            }
            else
            {
                // Un último empuje oficial del texto por si algo quedaba en el buffer
                string finalText = request.downloadHandler.text;
                if (!string.IsNullOrEmpty(finalText))
                {
                    onUpdate?.Invoke(finalText);
                }

                // Avisamos que ya concluyó todo el stream
                onComplete?.Invoke();
            }
        }
    }
}
