import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { AlertCircle, Code2, Terminal, LineChart } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

import { Card } from "./card";
import TimeComplexityChart from './TimeComplexityChart';
import './OnlineIDE.css';
import './monaco.css';

const OnlineIDE = () => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('output');
  const [executionError, setExecutionError] = useState('');
  const [complexity, setComplexity] = useState('O(1)');
  const [savedSnippets, setSavedSnippets] = useState([]);

  // Move API keys to environment variables in production
  const JUDGE_API_KEY = '139cb34320mshb5f8759efba2500p1e630djsn50798725f7ef';
  const PERPLEXITY_API_KEY = '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';

  const languages = {
    python: {
      id: 71,
      name: 'Python',
      defaultCode: '#Write your Python code here\n\nprint("Hello, World!")',
      mode: 'python'
    },
    javascript: {
      id: 63,
      name: 'JavaScript',
      defaultCode: '//Write your JavaScript code here\n\nconsole.log("Hello, World!");',
      mode: 'javascript'
    },
    java: {
      id: 62,
      name: 'Java',
      defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
      mode: 'java'
    },
    cpp: {
      id: 54,
      name: 'C++',
      defaultCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
      mode: 'cpp'
    },
    ruby: {
      id: 72,
      name: 'Ruby',
      defaultCode: '#Write your Ruby code here\n\nputs "Hello, World!"',
      mode: 'ruby'
    }
  };

  useEffect(() => {
    setCode(languages[selectedLanguage].defaultCode);
  }, [selectedLanguage]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
    setOutput('');
    setAnalysis('');
    setError('');
    setExecutionError('');
  };

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('Analyzing code...');
    setActiveTab('analysis');
    setError('');

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Provide a single, concise analysis starting with • that covers Syntax errors, purpose, complexity, and key improvements."
            },
            {
              role: "user",
              content: `Analyze this ${languages[selectedLanguage].name} code:\n${code}`
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000
        })
      });

      if (!response.ok) throw new Error(`Analysis failed: ${response.statusText}`);
      
      const data = await response.json();
      const formattedAnalysis = data.choices[0].message.content.startsWith('•') ? 
        data.choices[0].message.content : 
        `• ${data.choices[0].message.content}`;
      setAnalysis(formattedAnalysis);
    } catch (error) {
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, selectedLanguage, PERPLEXITY_API_KEY]);

  const analyzeComplexity = async () => {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Return only one of these exact values with no additional text: O(1), O(log_n), O(n), O(n_log_n), O(n^2), O(n^3), O(2^n)"
            },
            {
              role: "user",
              content: `Code:\n${code}`
            }
          ],
          temperature: 0.2,
          top_p: 0.9
        })
      });

      if (!response.ok) throw new Error(`Complexity analysis failed: ${response.statusText}`);
      
      const data = await response.json();
      setComplexity(data.choices[0].message.content.trim());
    } catch (error) {
      setError(`Complexity analysis failed: ${error.message}`);
    }
  };

  const handleGraphClick = async () => {
    await analyzeComplexity();
    setShowGraph(true);
    setActiveTab('complexity');
  };

  const pollSubmission = useCallback(async (token) => {
    const options = {
      headers: {
        'x-rapidapi-key': JUDGE_API_KEY,
        'x-rapidapi-host': 'judge029.p.rapidapi.com'
      }
    };

    while (true) {
      const response = await fetch(`https://judge029.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=*`, options);
      const data = await response.json();
      
      if (data.status?.id > 2) return data;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [JUDGE_API_KEY]);

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to run');
      return;
    }

    setIsLoading(true);
    setOutput('');
    setExecutionError('');
    setActiveTab('output');
    setError('');

    try {
      const response = await fetch('https://judge029.p.rapidapi.com/submissions?base64_encoded=false&fields=*', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-key': JUDGE_API_KEY,
          'x-rapidapi-host': 'judge029.p.rapidapi.com'
        },
        body: JSON.stringify({
          language_id: languages[selectedLanguage].id,
          source_code: code,
          stdin: ''
        })
      });

      if (!response.ok) throw new Error(`Code execution failed: ${response.statusText}`);

      const data = await response.json();
      const result = await pollSubmission(data.token);
      
      if (result.status.description === "Accepted") {
        setOutput(result.stdout || 'Code executed successfully with no output');
      } else {
        setExecutionError(result.stderr || result.compile_output || 'An error occurred during execution');
      }
    } catch (error) {
      setError(`Code execution failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [code, selectedLanguage, JUDGE_API_KEY, pollSubmission]);

  
  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-poppins font-bold">CodeEZ</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(languages).map(([key, lang]) => (
                <option key={key} value={key}>{lang.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleRunCode}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
              >
                <Terminal className="h-4 w-4" />
                {isLoading ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleGraphClick}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500"
              >
                <LineChart className="h-4 w-4" />
                Graph
              </button>
              <button
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                <Code2 className="h-4 w-4" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-6">
        <div className="grid h-full flex-1 gap-6 md:grid-cols-2">
          {/* Editor Section */}
          <Card className="flex h-full flex-col">
            <Editor
              height="100%"
              defaultLanguage={languages[selectedLanguage].mode}
              language={languages[selectedLanguage].mode}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbers: 'on',
                roundedSelection: false,
                padding: { top: 10 },
                renderLineHighlight: 'all'
              }}
            />
          </Card>

          {/* Output/Analysis Section */}
          <div className="flex h-full flex-col">
            {/* Tabs */}
            <div className="mb-4 flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('output')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'output' 
                    ? 'border-b-2 border-blue-500 text-blue-500' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Terminal className="h-4 w-4" />
                Output
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'analysis' 
                    ? 'border-b-2 border-blue-500 text-blue-500' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Code2 className="h-4 w-4" />
                Analysis
              </button>
              {showGraph && (
                <button
                  onClick={() => setActiveTab('complexity')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                    activeTab === 'complexity' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <LineChart className="h-4 w-4" />
                  Complexity
                </button>
              )}
            </div>

            {/* Content Area */}
            <Card className="relative flex flex-1 flex-col overflow-hidden">
              {error && (
                <Alert variant="destructive" className="absolute left-4 right-4 top-4 z-10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="absolute inset-0 overflow-y-auto">
                {activeTab === 'output' && (
                  <div className="h-full p-4 font-mono">
                    {executionError ? (
                      <div className="text-red-400">{executionError}</div>
                    ) : (
                      <div className="text-slate-300 whitespace-pre-wrap">{output}</div>
                    )}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="h-full p-4">
                    {analysis ? (
                      <div className="text-slate-300 whitespace-pre-line">{analysis}</div>
                    ) : (
                      <div className="text-slate-500">Click 'Analyze' to get code insights</div>
                    )}
                  </div>
                )}

                {activeTab === 'complexity' && showGraph && (
                  <div className="h-full p-4">
                    <TimeComplexityChart complexity={complexity} />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnlineIDE;
