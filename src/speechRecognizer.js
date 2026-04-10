const { ipcRenderer } = require('electron');

class SpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.sourceLang = 'ru-RU';
    this.targetLang = 'en-US';
  }

  async start(deviceId = null) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.sourceLang;

    this.recognition.onresult = async (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const translated = await this.translate(finalTranscript);
        ipcRenderer.send('update-overlay', {
          original: finalTranscript.trim(),
          translated: translated.trim(),
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart for continuous recognition
      if (this.isListening) {
        this.recognition.start();
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      
      this.recognition.start();
      this.isListening = true;
      console.log('Speech recognition started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      console.log('Speech recognition stopped');
    }
  }

  setLanguages(source, target) {
    this.sourceLang = source;
    this.targetLang = target;
    if (this.recognition) {
      this.recognition.lang = source;
    }
  }

  async translate(text) {
    // Using free MyMemory Translation API
    // For production, replace with DeepL, Google Translate, or OpenAI API
    try {
      const sourceLang = this.sourceLang.split('-')[0];
      const targetLang = this.targetLang.split('-')[0];
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      
      const data = await response.json();
      return data.responseData?.translatedText || text;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  }
}

module.exports = SpeechRecognizer;
