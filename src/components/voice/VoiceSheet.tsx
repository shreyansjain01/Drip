import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, X, RotateCcw } from 'lucide-react';
import { parseVoiceInput, type ParsedVoiceResult } from '../../lib/voice/parse';
import AmountDisplay from '../ui/AmountDisplay';
import CategoryChips from '../ui/CategoryChips';
import { formatINR } from '../../lib/money';
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(24).fill(8));
  const [isSaving, setIsSaving] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Auto-save countdown timer after voice detection
  useEffect(() => {
    if (countdown === null || countdown <= 0 || !parsedResult) return;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        executeFinalSave();
      } else {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, parsedResult]);

  // Check speech recognition capability on mount/open
  useEffect(() => {
    if (!isOpen) {
      setParsedResult(null);
      setTranscript('');
      setInputText('');
      setCountdown(null);
      setIsSaving(false);
      setIsListening(false);
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {}
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setParsedResult(null);
          setCountdown(null);
        };

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          setInputText(currentText);

          // Random waveform bars animation while listening
          setWaveformLevels(Array.from({ length: 24 }, () => 6 + Math.random() * 26));

          if (event.results[0].isFinal) {
            handleFinalTranscript(currentText);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(recognition);

        // Attempt initial start if supported
        try {
          recognition.start();
        } catch {}
      } catch {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  const toggleMic = () => {
    if (isListening && recognitionInstance) {
      try {
        recognitionInstance.stop();
        setIsListening(false);
      } catch {}
    } else if (recognitionInstance) {
      try {
        setTranscript('');
        setParsedResult(null);
        recognitionInstance.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
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

    // Start a 2-second auto-save countdown for hands-free logging
    if (result.amountPaise > 0) {
      setCountdown(2);
    }
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
    setCountdown(null);

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

    // Fire API request asynchronously in background
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaise: paise,
        categoryId: selectedCatId,
        label: editableLabel || cat.name,
        source: 'voice'
      })
    }).catch(() => {});

    onSaved?.(parsedResult || {
      amountPaise: paise,
      category: cat.name,
      label: editableLabel || cat.name,
      intent: 'expense',
      confidence: 1
    });

    // Close modal immediately
    onClose();

    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Main Bottom / Center Sheet */}
      <div className="w-full max-w-[420px] bg-[#B8ACFA] text-black rounded-t-[36px] sm:rounded-[36px] pt-4 pb-7 px-5 shadow-2xl flex flex-col items-center relative max-h-[88vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-250">
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-black/20 rounded-full mb-2" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-5 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black active:scale-90 transition-all cursor-pointer"
          aria-label="Close voice modal"
        >
          <X size={18} />
        </button>

        {!parsedResult ? (
          <div className="w-full flex flex-col items-center py-2 text-center">
            {/* Concentric Pulsing Rings & Mic Button */}
            <div className="relative w-22 h-22 flex items-center justify-center my-1.5">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                  <div className="absolute -inset-2.5 rounded-full border border-black/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={toggleMic}
                className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-[#B8ACFA] shadow-xl relative z-10 active:scale-95 transition-all cursor-pointer"
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic size={26} strokeWidth={2} />
              </button>
            </div>

            {/* Waveform indicator */}
            <div className="flex items-center justify-center gap-[3px] h-7 my-1">
              {waveformLevels.map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-[#FBF8EC] rounded-full transition-all duration-100"
                  style={{ height: isListening ? `${Math.min(h, 22)}px` : '6px' }}
                />
              ))}
            </div>

            <p className="font-title text-[16px] font-semibold text-black mt-0.5">
              {isListening ? 'Listening...' : transcript || 'Tap mic to speak or enter below'}
            </p>

            {/* Quick Natural Voice / Text Bar (Safari & Mobile Dictation Friendly) */}
            <form onSubmit={handleInputSubmit} className="w-full mt-3 flex items-center gap-1.5 bg-white/70 rounded-full px-3.5 py-1.5 shadow-sm border border-black/10">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. paid 60 for breakfast"
                className="flex-1 bg-transparent text-[14px] text-black placeholder:text-black/45 font-medium focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black text-white text-[12px] font-semibold rounded-full active:scale-95 transition-transform cursor-pointer"
              >
                Add
              </button>
            </form>

            <span className="font-caption text-black/60 text-[11.5px] mt-1.5">
              💡 Tap your phone keyboard's mic 🎙️ to dictate naturally.
            </span>

            {/* Quick simulation buttons */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => simulateSpeech('paid 60 for breakfast')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11.5px] font-medium text-black active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                "paid 60 for breakfast"
              </button>
              <button
                type="button"
                onClick={() => simulateSpeech('spent 250 on petrol')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11.5px] font-medium text-black active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                "spent 250 on petrol"
              </button>
              <button
                type="button"
                onClick={() => simulateSpeech('chai 20')}
                className="px-3 py-1 bg-white/60 hover:bg-white rounded-full text-[11.5px] font-medium text-black active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                "chai 20"
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Card */
          <div className="w-full flex flex-col gap-3 pt-1">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/10 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                  {parsedResult.intent === 'goal_contribution' ? 'Goal Contribution' : 'Expense Detected'}
                </span>
                {countdown !== null && (
                  <span className="text-[11px] font-bold text-black bg-white px-1.5 py-0.2 rounded-full">
                    Saving in {countdown}s
                  </span>
                )}
              </div>
              <div className="my-1">
                <AmountDisplay value={editableAmount} showCaret={false} />
              </div>
            </div>

            {/* Editable Label */}
            <div className="bg-white/60 p-2.5 rounded-2xl flex flex-col gap-1 border border-black/5">
              <span className="text-[11px] text-black/50 font-medium">Label</span>
              <input
                type="text"
                value={editableLabel}
                onChange={(e) => {
                  setEditableLabel(e.target.value);
                  setCountdown(null); // Pause countdown when user edits
                }}
                className="w-full bg-transparent font-medium text-black text-[14px] focus:outline-none"
              />
            </div>

            {/* Category selection */}
            <div>
              <span className="text-[11px] text-black/60 font-medium mb-1 block">Category</span>
              <CategoryChips
                categories={DEFAULT_CATEGORIES}
                selectedId={selectedCatId}
                onSelect={(id) => {
                  setSelectedCatId(id);
                  setCountdown(null); // Pause countdown when user changes category
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={executeFinalSave}
                disabled={isSaving}
                className="w-full h-12 rounded-[20px] bg-black text-white font-body-500 text-[15px] font-semibold flex items-center justify-center gap-2 pressable shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check size={18} strokeWidth={2.5} />
                {isSaving ? 'Adding...' : 'Save & Done'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setParsedResult(null);
                  setTranscript('');
                  setInputText('');
                  setCountdown(null);
                }}
                className="text-[12px] font-medium text-black/60 hover:text-black text-center py-1 cursor-pointer"
              >
                Try saying again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSheet;
