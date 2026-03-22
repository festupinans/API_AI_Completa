using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UI_Manager : MonoBehaviour
{
    [SerializeField] private TMP_InputField inputField;
    [SerializeField] private TextMeshProUGUI responseText;
    [SerializeField] private Button sendButton;

    private IA_Manager iA_Manager;

    void Awake()
    {
        iA_Manager = GetComponent<IA_Manager>();
    }

    void Start()
    {
        sendButton.onClick.AddListener(OnSendButtonClicked);
    }

    private void OnSendButtonClicked()
    {
        string userMessage = inputField.text;
        if (!string.IsNullOrEmpty(userMessage))
        {
            // Bloquear botón y campo de texto temporalmente
            sendButton.interactable = false;
            inputField.interactable = false;
            responseText.text = "Pensando...";
            
            // Limpiar campo de texto para la proxima
            inputField.text = ""; 

            // Llamar a IA_Manager y enviarle callbacks para manejar el resultado en stream
            iA_Manager.AskIA(userMessage, 
                // Callback 1: onUpdate (llamado muchísimas veces mientras llega stream)
                onUpdate: (textoParcialUrl) => 
                {
                    responseText.text = textoParcialUrl;
                },
                // Callback 2: onComplete (llamado 1 sola vez al terminar todo)
                onComplete: () => 
                {
                    ReactivarUI();
                },
                // Callback 3: onError (llamado 1 sola vez si algo se rompe)
                onError: (errorMsg) => 
                {
                    responseText.text = $"<color=red><b>Error:</b> {errorMsg}</color>";
                    ReactivarUI();
                }
            );
        }
    }

    private void ReactivarUI()
    {
        sendButton.interactable = true;
        inputField.interactable = true;
        inputField.ActivateInputField(); // Devolver el foco al campo tras recibir la respuesta
    }
}
