import React, { useState, useEffect, useRef } from 'react';
import { Mic, Check, X } from 'lucide-react';
import { parseVoiceInput, type ParsedVoiceResult } from '../../lib/voice/parse';
import AmountDisplay from '../ui/AmountDisplay';
import CategoryChips from '../ui/CategoryChips';
import { addLocalExpense } from '../../lib/stores/expenseStore';
import { playExpenseAddedSound } from '../../lib/audio';

interface VoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (res: ParsedVoiceResult) => void;
}

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food & Drinks', icon: 'Utensils' },
  { id: '2', name: 'Transport', icon: 'Car' },
  { id: '3', name: 'Shopping', icon: 'ShoppingBag' },
  { id: '4', name: 'Bills & Utilities', icon: 'Receipt' },
  { id: '5', name: 'Groceries', icon: 'Package' }
];

export const VoiceSheet: React.FC<VoiceSheetProps> = ({ isOpen, onClose, onSaved }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [editableAmount, setEditableAmount] = useState('');
  const [editableLabel, setEditableLabel] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('1');
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(24).fill(6));
  const [isSaving, setIsSaving] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>('');
  const waveIntervalRef = useRef<any>(null);
  const restartCountRef = useRef<number>(0);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setParsedResult(null);
      setTranscript('');
      transcriptRef.current = '';
      setInputText('');
      setIsSaving(false);
      restartCountRef.current = 0;
    }
  }, [isOpen]);

  const cleanupAudio = () => {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
    setWaveformLevels(Array(24).fill(6));
  };

  const startWaveAnimation = () => {
    cleanupAudio();
    waveIntervalRef.current = setInterval(() => {
      setWaveformLevels(
        Array.from({ length: 24 }, (_, i) => {
          const factor = Math.sin((i / 24) * Math.PI);
          return Math.max(5, Math.round(factor * (12 + Math.random() * 16)));
        })
      );
    }, 90);
  };

  const startListening = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTranscript('Speech recognition is not supported in this browser. You can type or use your keyboard microphone.');
      return;
    }

    // Step 1: Ensure OS microphone permission is granted without locking audio hardware
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setIsListening(false);
          isListeningRef.current = false;
          cleanupAudio();
          setTranscript('Microphone permission was denied. Please allow microphone access in settings.');
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      // Use continuous = true to prevent Google App / Android WebViews from prematurely cutting off
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      const userLang = (navigator.language || 'en-IN').toLowerCase();
      recognition.lang = userLang.startsWith('en') ? 'en-IN' : (navigator.language || 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setTranscript('');
        transcriptRef.current = '';
        setParsedResult(null);
        startWaveAnimation();
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        if (combined) {
          setTranscript(combined);
          transcriptRef.current = combined;
          setInputText(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'no-speech') {
          // In Google App, no-speech may fire intermittently during pauses; don't terminate immediately
          return;
        }
        if (event.error === 'aborted') {
          return;
        }

        setIsListening(false);
        isListeningRef.current = false;
        cleanupAudio();

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setTranscript('Microphone permission was denied. Please allow microphone access in settings.');
        } else if (event.error === 'network') {
          setTranscript('Network issue with speech recognition. Please check your connection or type below.');
        } else {
          setTranscript(`Recognition message: ${event.error}. You can also type below.`);
        }
      };

      recognition.onend = () => {
        // If recognition closed prematurely while the user was speaking, attempt graceful restart (up to 2 times)
        if (isListeningRef.current) {
          if (!transcriptRef.current.trim() && restartCountRef.current < 2) {
            restartCountRef.current += 1;
            try {
              recognition.start();
              return;
            } catch {}
          }

          setIsListening(false);
          isListeningRef.current = false;
          cleanupAudio();

          const finalText = transcriptRef.current || inputText;
          if (finalText.trim()) {
            handleFinalTranscript(finalText);
          }
          return;
        }

        setIsListening(false);
        isListeningRef.current = false;
        cleanupAudio();
      };

      restartCountRef.current = 0;
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      isListeningRef.current = false;
      cleanupAudio();
      setTranscript('Could not start microphone: ' + (err.message || 'Please try again or type below.'));
    }
  };

  const stopListening = () => {
    setIsListening(false);
    isListeningRef.current = false;
    cleanupAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const toggleMic = () => {
    if (isListening) {
      const text = transcriptRef.current || transcript || inputText;
      stopListening();
      if (text.trim()) {
        handleFinalTranscript(text);
      }
    } else {
      startListening();
    }
  };

  const handleFinalTranscript = (text: string) => {
    if (!text.trim()) return;
    const result = parseVoiceInput(text);
    setParsedResult(result);
    setEditableAmount((result.amountPaise / 100).toString());
    setEditableLabel(result.label);
    const matched = DEFAULT_CATEGORIES.find((c) => c.name === result.category);
    if (matched) setSelectedCatId(matched.id);

    stopListening();
  };

  const simulateSpeech = (sampleText: string) => {
    setInputText(sampleText);
    setTranscript(sampleText);
    handleFinalTranscript(sampleText);
  };

  const handleInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      handleFinalTranscript(inputText);
    }
  };

  const executeFinalSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const paise = Math.round(parseFloat(editableAmount || '0') * 100);
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === selectedCatId) || DEFAULT_CATEGORIES[0];

    // Play liquid pop audio confirmation
    playExpenseAddedSound();

    // Persist to local reactive store immediately
    addLocalExpense({
      title: editableLabel || cat.name,
      category: cat.name,
      iconName: cat.icon,
      amountPaise: paise
    });

    onSaved?.(parsedResult || {
      amountPaise: paise,
      category: cat.name,
      label: editableLabel || cat.name,
      intent: 'expense',
      confidence: 1,
      rawText: transcript || inputText
    });

    // Close modal
    onClose();

    // If currently on /add page, redirect to home page to see transaction
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/add')) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Main Bottom Sheet */}
      <div className="w-full max-w-[420px] bg-[#B8ACFA] text-black rounded-t-[36px] sm:rounded-[36px] pt-4 pb-7 px-5 shadow-2xl flex flex-col items-center relative max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-250">
        
        {/* Top Header: Handle bar & Close */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="w-8" />
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black active:scale-90 transition-all cursor-pointer"
            aria-label="Close voice modal"
          >
            <X size={18} />
          </button>
        </div>

        {!parsedResult ? (
          /* Listening / Input View */
          <div className="w-full flex flex-col items-center text-center">
            
            <h3 className="font-title text-[20px] font-semibold text-black mb-1">
              {isListening ? 'Listening...' : 'Voice Expense'}
            </h3>
            
            <p className="font-caption text-black/60 text-[13px] mb-3">
              {isListening ? 'Speak now e.g. "Paid 60 for breakfast"' : 'Tap mic and speak your expense'}
            </p>

            {/* Mic Circle & Waves */}
            <div className="relative w-24 h-24 flex items-center justify-center my-2">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                  <div className="absolute -inset-3 rounded-full border-2 border-black/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={toggleMic}
                className="w-18 h-18 rounded-full bg-black flex items-center justify-center text-[#B8ACFA] shadow-xl relative z-10 active:scale-95 transition-all cursor-pointer"
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic size={30} strokeWidth={2.2} />
              </button>
            </div>

            {/* Real Audio Waveform */}
            <div className="flex items-center justify-center gap-[3px] h-7 my-1">
              {waveformLevels.map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-black/80 rounded-full transition-all duration-100"
                  style={{ height: isListening ? `${Math.min(h, 24)}px` : '5px' }}
                />
              ))}
            </div>

            {/* Live Spoken Words Bubble */}
            {transcript && (
              <div className="w-full bg-white/80 border border-black/10 rounded-2xl p-3 my-2 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-black/40 block mb-0.5">
                  Heard:
                </span>
                <p className="text-[15px] font-semibold text-black leading-snug">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Done Speaking button when listening */}
            {isListening && (
              <button
                type="button"
                onClick={toggleMic}
                className="w-full max-w-[200px] h-10 mt-1 mb-2 bg-black text-white font-semibold text-[13px] rounded-full flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} /> Done Speaking
              </button>
            )}

            {/* Divider */}
            <div className="w-full flex items-center gap-3 my-3">
              <div className="flex-1 h-[1px] bg-black/15" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/50">or type below</span>
              <div className="flex-1 h-[1px] bg-black/15" />
            </div>

            {/* Clean Manual Input Form */}
            <form onSubmit={handleInputSubmit} className="w-full flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-black/10">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. 150 coffee or petrol 200"
                className="flex-1 px-3 bg-transparent text-[14px] text-black placeholder:text-black/40 font-medium focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-5 bg-black hover:bg-black/90 text-white font-semibold text-[13px] rounded-xl active:scale-95 transition-transform cursor-pointer"
              >
                Review
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => simulateSpeech('paid 60 for breakfast')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11px] font-medium text-black active:scale-95 transition-all cursor-pointer"
              >
                "paid 60 for breakfast"
              </button>
              <button
                type="button"
                onClick={() => simulateSpeech('spent 250 on petrol')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11px] font-medium text-black active:scale-95 transition-all cursor-pointer"
              >
                "spent 250 on petrol"
              </button>
              <button
                type="button"
                onClick={() => simulateSpeech('chai 20')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11px] font-medium text-black active:scale-95 transition-all cursor-pointer"
              >
                "chai 20"
              </button>
            </div>
          </div>
        ) : (
          /* Explicit User Confirmation Card (No Timer) */
          <div className="w-full flex flex-col gap-3 pt-1">
            <div className="text-center">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-black/60 bg-black/10 px-3 py-1 rounded-full mb-1">
                {parsedResult.intent === 'goal_contribution' ? '🎯 Goal Contribution' : '💸 Expense Detected'}
              </span>
              <p className="text-[12px] text-black/60 mt-0.5">
                Review details and confirm to add:
              </p>
              <div className="my-2">
                <AmountDisplay value={editableAmount} showCaret={false} />
              </div>
            </div>

            {/* Editable Label */}
            <div className="bg-white/80 p-3 rounded-2xl flex flex-col gap-1 border border-black/10 shadow-xs">
              <span className="text-[11px] text-black/50 font-medium">Description / Title</span>
              <input
                type="text"
                value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                placeholder="Expense label"
                className="w-full bg-transparent font-semibold text-black text-[15px] focus:outline-none"
              />
            </div>

            {/* Category selection */}
            <div>
              <span className="text-[11px] text-black/60 font-medium mb-1 block px-1">Category</span>
              <CategoryChips
                categories={DEFAULT_CATEGORIES}
                selectedId={selectedCatId}
                onSelect={setSelectedCatId}
              />
            </div>

            {/* Confirmation & Cancel Buttons */}
            <div className="flex flex-col gap-2 mt-3">
              <button
                type="button"
                onClick={executeFinalSave}
                disabled={isSaving || !editableAmount || editableAmount === '0'}
                className="w-full h-13 rounded-[20px] bg-black hover:bg-black/90 text-white font-semibold text-[15px] flex items-center justify-center gap-2 pressable shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
              >
                <Check size={18} strokeWidth={2.5} />
                {isSaving ? 'Adding Expense...' : '✓ Confirm & Add Expense'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setParsedResult(null);
                  setTranscript('');
                  transcriptRef.current = '';
                  setInputText('');
                }}
                className="w-full h-10 text-[13px] font-medium text-black/70 hover:text-black text-center active:scale-95 transition-all cursor-pointer"
              >
                ✕ Cancel / Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSheet;
