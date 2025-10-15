import { useState, useRef } from 'react';
import { convertCodeToLanguage } from './api/codeConverter';
import './App.css';

interface ProcessedFile {
  name: string;
  size: number;
  timestamp: string;
  status: 'processing' | 'success' | 'error';
  originalLanguage?: string;
  targetLanguage?: string;
  convertedCode?: string;
  originalCode?: string;
  errorMessage?: string;
}

const TARGET_LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '📜' },
  { value: 'typescript', label: 'TypeScript', icon: '💙' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'csharp', label: 'C#', icon: '🎯' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'swift', label: 'Swift', icon: '🔶' },
  { value: 'kotlin', label: 'Kotlin', icon: '🟣' },
];

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (filename: string, code: string, targetLang: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const extensions: Record<string, string> = {
      python: '.py',
      javascript: '.js',
      typescript: '.ts',
      java: '.java',
      cpp: '.cpp',
      csharp: '.cs',
      go: '.go',
      rust: '.rs',
      ruby: '.rb',
      php: '.php',
      swift: '.swift',
      kotlin: '.kt',
    };
    
    const convertedFilename = filename.replace(/\.[^/.]+$/, '') + extensions[targetLang];
    link.href = url;
    link.download = convertedFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadOriginalFile = (filename: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const detectLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'go': 'Go',
      'rs': 'Rust',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'py': 'Python',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
    };
    return langMap[ext || ''] || 'Unknown';
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const timestamp = new Date().toLocaleString();
      const language = detectLanguage(file.name);
      const targetLangInfo = TARGET_LANGUAGES.find(l => l.value === selectedLanguage);
      const targetLang = targetLangInfo?.label || selectedLanguage;
      
      setProcessedFiles(prev => [{
        name: file.name,
        size: file.size,
        timestamp,
        status: 'processing',
        originalLanguage: language,
        targetLanguage: targetLang,
        originalCode: ''
      }, ...prev]);

      try {
        const content = await file.text();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📁 Original File: ${file.name}`);
        console.log(`📊 Size: ${file.size} bytes`);
        console.log(`🔤 From: ${language}`);
        console.log(`🎯 To: ${targetLang}`);
        console.log(`🕐 Timestamp: ${timestamp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Original Code:');
        console.log(content);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`🔄 Converting to ${targetLang} using AI...\n`);
        
        // Use the actual codeConverter.ts function
        const convertedCode = await convertCodeToLanguage(content, language, selectedLanguage);

        if (convertedCode && !convertedCode.includes('❌ Conversion failed')) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`✨ ${targetLang} Conversion Result for: ${file.name}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(convertedCode);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          setProcessedFiles(prev => 
            prev.map((f, idx) => 
              idx === 0 ? { ...f, status: 'success', convertedCode, originalCode: content } : f
            )
          );

          downloadFile(file.name, convertedCode, selectedLanguage);
        } else {
          throw new Error('Conversion failed - please check console for details');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing file ${file.name}:`, error);
        
        setProcessedFiles(prev => 
          prev.map((f, idx) => 
            idx === 0 ? { ...f, status: 'error', errorMessage: errorMsg } : f
          )
        );
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const selectedLangInfo = TARGET_LANGUAGES.find(l => l.value === selectedLanguage);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdd3de 0%, #fdd3de 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>

          <div className='header-main' >
         
         <img
         className='header-image'
    src="./logo.png"
    alt="Logo"
    style={{
      height: '60px',
      width: '60px',
      objectFit: 'contain',
    }}
  />

          <h1 
         className='header-text'

          style={{
            fontWeight: 'bold',
            marginBottom: '12px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            color : '#000'
          }}>
            {/* <span style={{ fontSize: '48px', marginRight: '12px' }}>🔄</span> */}
            Sentient Code Language Converter
          </h1>

          </div>


          <p style={{
            fontSize: '18px',
            color : '#000',
            marginBottom: '0'
          }}>
            Convert code between any programming language using AI
          </p>
        </header>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            🎯 Convert to:
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {TARGET_LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setSelectedLanguage(lang.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: selectedLanguage === lang.value ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: selectedLanguage === lang.value ? '#f0f4ff' : 'white',
                  color: selectedLanguage === lang.value ? '#667eea' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{lang.icon}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            background: isDragging ? 'rgba(255,255,255,0.95)' : 'white',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            border: isDragging ? '3px dashed #667eea' : '3px dashed #d1d5db',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".js,.jsx,.ts,.tsx,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.swift,.kt,.scala,.py,.html,.css,.json"
          />
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {isDragging ? '📂' : '⬆️'}
          </div>
          <p style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {isDragging ? 'Release to convert files' : 'Drop your code files here'}
          </p>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Will convert to {selectedLangInfo?.icon} {selectedLangInfo?.label}
          </p>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '20px'
          }}>
            Supports: JS, TS, Java, C++, Python, Go, Rust, Ruby, PHP, Swift, Kotlin & more
          </p>
          <button
            onClick={handleBrowseClick}
            style={{
              padding: '12px 32px',
              borderRadius: '10px',
              border: '2px solid #667eea',
              background: '#667eea',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            📁 Browse Files
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          color: '#000',
          fontSize: '14px',
          backdropFilter: 'blur(10px)'
        }}>
          💡 <strong>Tip:</strong> Open your browser's Console (F12) to see detailed conversion logs
        </div>

        {processedFiles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📋</span>
              Conversion History ({processedFiles.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {processedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    background: file.status === 'success' ? '#f0fdf4' : file.status === 'error' ? '#fef2f2' : '#fafafa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {file.name}
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>
                      {file.originalLanguage} → {file.targetLanguage} • {formatSize(file.size)} • {file.timestamp}
                    </p>
                    {file.status === 'error' && file.errorMessage && (
                      <p style={{
                        fontSize: '12px',
                        color: '#dc2626',
                        marginTop: '4px'
                      }}>
                        Error: {file.errorMessage}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {file.status === 'success' && (
                      <>
                        {file.originalCode && (
                          <button
                            onClick={() => downloadOriginalFile(file.name, file.originalCode!)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Download original file"
                          >
                            📄 Original
                          </button>
                        )}
                        {file.convertedCode && (
                          <button
                            onClick={() => downloadFile(file.name, file.convertedCode!, selectedLanguage)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#667eea',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Download converted file"
                          >
                            ⬇️ Converted
                          </button>
                        )}
                      </>
                    )}
                    <span style={{ fontSize: '24px' }}>{getStatusIcon(file.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;