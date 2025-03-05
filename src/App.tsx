import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Github, Linkedin, Mail, ChevronRight, Download } from 'lucide-react';

type Command = {
  command: string;
  output: React.ReactNode;
};

const AVAILABLE_COMMANDS = [
  'about',
  'projects',
  'skills',
  'experience',
  'contact',
  'download',
  'clear',
  'help'
];

function TypewriterText({ text, speed = 50, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayedText}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center text-green-400 mb-2">
        <ChevronRight className="w-4 h-4 mr-2" />
        <h2 className="text-xl">{title}</h2>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

function SkillCategory({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div className="mb-4">
      <h3 className="text-green-400 mb-2"># {title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {skills.map((skill, index) => (
          <div key={index} className="text-gray-300">$ {skill}</div>
        ))}
      </div>
    </div>
  );
}

function Experience({ company, role, period, location, responsibilities }: {
  company: string;
  role: string;
  period: string;
  location: string;
  responsibilities: string[];
}) {
  return (
    <div className="mb-6">
      <div className="text-yellow-400">{role} @ {company}</div>
      <div className="text-gray-500 mb-2">{period} | {location}</div>
      <ul className="list-disc list-inside text-gray-300">
        {responsibilities.map((resp, index) => (
          <li key={index} className="ml-4">{resp}</li>
        ))}
      </ul>
    </div>
  );
}

function TerminalInterface({ history, currentCommand, onCommandChange, onCommandSubmit }: {
  history: Command[];
  currentCommand: string;
  onCommandChange: (cmd: string) => void;
  onCommandSubmit: (cmd: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleTabCompletion = (input: string) => {
    const matchingCommands = AVAILABLE_COMMANDS.filter(cmd => 
      cmd.startsWith(input.toLowerCase())
    );

    if (matchingCommands.length === 1) {
      // If there's only one match, complete it
      onCommandChange(matchingCommands[0]);
      setShowSuggestions(false);
    } else if (matchingCommands.length > 1) {
      // If there are multiple matches, show suggestions
      setSuggestions(matchingCommands);
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion(currentCommand);
    } else if (e.key === 'Enter') {
      onCommandSubmit(currentCommand);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div 
      ref={terminalRef}
      className="bg-black text-green-400 p-4 rounded-md overflow-y-auto h-[calc(100vh-2rem)]"
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((entry, i) => (
        <div key={i} className="mb-4">
          <div className="flex items-center">
            <span className="text-yellow-400">guest@portfolio</span>
            <span className="text-gray-400">:</span>
            <span className="text-blue-400">~$</span>
            <span className="ml-2">{entry.command}</span>
          </div>
          <div className="mt-2 ml-4">{entry.output}</div>
        </div>
      ))}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="text-yellow-400">guest@portfolio</span>
          <span className="text-gray-400">:</span>
          <span className="text-blue-400">~$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="ml-2 bg-transparent border-none outline-none flex-1 text-green-400"
            autoFocus
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="ml-4 mt-2 text-gray-500">
            Suggestions: {suggestions.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [history, setHistory] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAllContent, setShowAllContent] = useState(false);

  const aboutSection = (
    <Section title="About Me">
      <p className="text-gray-300 leading-relaxed">
        Proficient Software Engineer versed in designing, developing, and maintaining both mobile and web applications. 
        Extensive experience deploying and maintaining cloud services. Skilled in Java, Kotlin, Javascript ES6, 
        Typescript and Python. Experience with Test-Driven-Development, ADA Accessible UI implementation, continuous 
        integration tools, and agile software development methodologies.
      </p>
    </Section>
  );

  const projectSection = (
    <Section title="Featured Project">
      <div className="bg-gray-900 p-4 rounded-md mb-4">
        <h3 className="text-yellow-400 text-lg mb-2">Untitled Resume Tuner</h3>
        <p className="text-gray-300 mb-4">
          Resume Tuner is an AI-powered web app designed to optimize your resume for any job application. 
          With a React frontend and Flask backend, it analyzes both your resume and the job description 
          to extract key data, suggest tailored improvements, and ensure better alignment with applicant 
          tracking systems.
        </p>
        <a 
          href="https://github.com" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300"
        >
          <Github className="w-4 h-4 mr-2" />
          View on GitHub
        </a>
      </div>
    </Section>
  );

  const skillsSection = (
    <Section title="Skills">
      <SkillCategory 
        title="Programming Languages" 
        skills={["Kotlin", "Java", "TypeScript", "Python", "JavaScript", "C#"]} 
      />
      <SkillCategory 
        title="Frameworks" 
        skills={["React", "Node.js", "Android SDK", "Next.js", "Express", "Django"]} 
      />
      <SkillCategory 
        title="Cloud & DevOps" 
        skills={["AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis"]} 
      />
    </Section>
  );

  const experienceSection = (
    <Section title="Experience">
      <Experience 
        company="JP Morgan Chase & Co"
        role="Software Engineer II"
        period="Aug 2023 - June 2024"
        location="Wilmington, DE"
        responsibilities={[
          "Maintained and enhanced legacy Java applications",
          "Developed new features in Spring Boot and React",
          "Managed CI pipelines and code quality"
        ]}
      />
      <Experience 
        company="Wells Fargo"
        role="Android Developer"
        period="Dec 2021 - Jul 2023"
        location="San Francisco, CA / Remote"
        responsibilities={[
          "Contributed to Android app redevelopment (10M+ downloads)",
          "Implemented deep linking and Zelle API integration",
          "Launched LifeSync financial planning tool"
        ]}
      />
    </Section>
  );

  const contactSection = (
    <Section title="Contact">
      <div className="flex flex-col space-y-2">
        <a href="mailto:harry@fumblebee.site" className="flex items-center text-gray-300 hover:text-green-400">
          <Mail className="w-4 h-4 mr-2" />
          harry@fumblebee.site
        </a>
        <a href="https://linkedin.com/in/harry-winkler" className="flex items-center text-gray-300 hover:text-green-400">
          <Linkedin className="w-4 h-4 mr-2" />
          linkedin.com/in/harry-winkler
        </a>
      </div>
    </Section>
  );
  
  const downloadSection = (
    <Section title="Download Resume">
      <div className="text-gray-300 mb-4">
        Click below to download my resume:
      </div>
      <a 
        href="/harrison_winkler.pdf" 
        download="harrison_winkler.pdf"
        className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Resume
      </a>
    </Section>
  );

  const helpText = (
    <div className="text-gray-300">
      Available commands:
      <ul className="list-disc list-inside mt-2 ml-4">
        <li>about - Display information about me</li>
        <li>projects - Show featured projects</li>
        <li>skills - List technical skills</li>
        <li>experience - Show work experience</li>
        <li>contact - Display contact information</li>
        <li>download - Download my resume</li>
        <li>clear - Clear the terminal</li>
        <li>help - Show this help message</li>
      </ul>
    </div>
  );

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    let output: React.ReactNode;

    switch (command) {
      case 'about':
        output = aboutSection;
        break;
      case 'projects':
        output = projectSection;
        break;
      case 'skills':
        output = skillsSection;
        break;
      case 'experience':
        output = experienceSection;
        break;
      case 'contact':
        output = contactSection;
        break;
      case 'download':
        output = downloadSection;
        break;
      case 'help':
        output = helpText;
        break;
      case 'clear':
        setHistory([]);
        setCurrentCommand('');
        return;
      case '':
        output = '';
        break;
      default:
        output = <span className="text-red-400">Command not found. Type 'help' for available commands.</span>;
    }

    if (command !== '') {
      setHistory(prev => [...prev, { command: cmd, output }]);
    }
    setCurrentCommand('');
  };

  const allContentSection = (
    <div className="mt-8 space-y-12">
      {aboutSection}
      {skillsSection}
      {experienceSection}
      {projectSection}
      {contactSection}
      {downloadSection}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      {showAllContent ? (
        <div>
          <h1 className="text-3xl text-yellow-400 mb-8">Harrison Winkler's Portfolio</h1>
          {allContentSection}
          <button 
            onClick={() => setShowAllContent(false)}
            className="mt-8 text-blue-400 border border-blue-400 px-4 py-2 rounded font-mono hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
          >
            $ return-to-terminal
          </button>
        </div>
      ) : (
        <>
          {showWelcome ? (
            <div className="flex items-center mb-8">
              <Terminal className="w-6 h-6 mr-2" />
              <TypewriterText 
                text="Welcome to Harry's Portfolio Terminal. Type 'help' for available commands." 
                onComplete={() => setShowWelcome(false)}
              />
            </div>
          ) : (
            <TerminalInterface
              history={history}
              currentCommand={currentCommand}
              onCommandChange={setCurrentCommand}
              onCommandSubmit={handleCommand}
            />
          )}
          <button 
            onClick={() => setShowAllContent(true)}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 hover:text-green-400 text-sm border-b border-dashed border-gray-700 pb-1 transition-colors"
          >
            $ just-show-me-everything
          </button>
        </>
      )}
    </div>
  );
}

export default App;