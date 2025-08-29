import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  Share2, 
  RotateCcw, 
  Edit3, 
  Table2, 
  Users, 
  CheckSquare, 
  MessageSquare,
  Calendar,
  Clock
} from "lucide-react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Type,
  Palette,
  Smile
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MinutesEditorProps {
  meetingData: any;
  onStartOver: () => void;
}

const MinutesEditor = ({ meetingData, onStartOver }: MinutesEditorProps) => {
  const [activeView, setActiveView] = useState<'editor' | 'table'>('editor');
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState<string>(meetingData.minutes_html || "");
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [fontSizeStep, setFontSizeStep] = useState<number>(0); // relative steps from base
  const savedSelectionRef = useRef<Range | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const historyRef = useRef<{ stack: string[]; index: number }>({ stack: [], index: -1 });

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    toast({
      title: "Export started",
      description: `Generating ${format.toUpperCase()} file...`
    });
    // TODO: Implement export functionality
  };

  const handleShare = () => {
    toast({
      title: "Share link generated",
      description: "Meeting minutes link copied to clipboard"
    });
    // TODO: Implement share functionality
  };

  // Ensure editor initializes with provided HTML
  useEffect(() => {
    setHtml(meetingData.minutes_html || "");
    // initialize history with initial content
    historyRef.current = { stack: [meetingData.minutes_html || ""], index: 0 };
  }, [meetingData.minutes_html]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = savedSelectionRef.current;
    if (!range) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const withEditorFocus = (fn: () => void) => {
    // restore prior selection instead of shifting focus which would lose selection
    restoreSelection();
    fn();
  };

  // Use document.execCommand for basic rich text actions (works widely)
  const exec = (command: string, value?: string) => {
    withEditorFocus(() => {
      document.execCommand(command, false, value);
      // keep state in sync
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        setHtml(newHtml);
        pushHistory(newHtml);
      }
    });
  };

  const applyInlineStyle = (style: Partial<CSSStyleDeclaration>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement('span');
    Object.assign(span.style, style);
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtml(newHtml);
      pushHistory(newHtml);
    }
  };

  const changeFontSize = (delta: number) => {
    setFontSizeStep((prev) => {
      const next = Math.max(-2, Math.min(4, prev + delta));
      const base = 16; // px
      const sizePx = base + next * 2; // step size 2px
      applyInlineStyle({ fontSize: `${sizePx}px` });
      return next;
    });
  };

  const applyColor = (color: string) => {
    // Try execCommand foreColor first; fallback to inline style
    try {
      exec('foreColor', color);
    } catch {
      applyInlineStyle({ color });
    }
  };

  const insertEmoji = (emoji: string) => {
    withEditorFocus(() => {
      document.execCommand('insertText', false, emoji);
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        setHtml(newHtml);
        pushHistory(newHtml);
      }
    });
  };

  const pushHistory = (content: string) => {
    const hist = historyRef.current;
    // if we are not at top, drop redo branch
    if (hist.index < hist.stack.length - 1) {
      hist.stack = hist.stack.slice(0, hist.index + 1);
    }
    if (hist.stack[hist.index] !== content) {
      hist.stack.push(content);
      hist.index += 1;
    }
  };

  const handleUndo = () => {
    const hist = historyRef.current;
    if (hist.index <= 0) return;
    hist.index -= 1;
    const content = hist.stack[hist.index];
    isRestoringRef.current = true;
    setHtml(content);
    if (editorRef.current) editorRef.current.innerHTML = content;
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);
  };

  const handleRedo = () => {
    const hist = historyRef.current;
    if (hist.index >= hist.stack.length - 1) return;
    hist.index += 1;
    const content = hist.stack[hist.index];
    isRestoringRef.current = true;
    setHtml(content);
    if (editorRef.current) editorRef.current.innerHTML = content;
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-poppins font-bold gradient-text mb-2">
              {meetingData.title}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(meetingData.date || new Date().toISOString())}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Generated just now
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onStartOver} className="film-button">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button variant="outline" onClick={handleShare} className="film-button">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              onClick={() => handleExport('pdf')} 
              className="glow-box film-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'editor' | 'table')}>
          <TabsList className="bg-card/50 border-glow">
            <TabsTrigger value="editor" className="film-button">
              <Edit3 className="w-4 h-4 mr-2" />
              Rich Editor
            </TabsTrigger>
            <TabsTrigger value="table" className="film-button">
              <Table2 className="w-4 h-4 mr-2" />
              Table View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript Panel */}
        <div className="lg:col-span-1">
          <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Original Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {meetingData.transcript}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Minutes Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeView}>
            <TabsContent value="editor">
              <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Meeting Minutes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-lg bg-background/60 border border-white/10" onMouseDown={saveSelection}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-md hover:shadow-[0_0_0.5rem_rgba(255,255,255,0.25)]" onClick={() => exec('bold')} aria-label="Bold">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md hover:shadow-[0_0_0.5rem_rgba(255,255,255,0.25)]" onClick={() => exec('italic')} aria-label="Italic">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md hover:shadow-[0_0_0.5rem_rgba(255,255,255,0.25)]" onClick={() => exec('underline')} aria-label="Underline">
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md hover:shadow-[0_0_0.5rem_rgba(255,255,255,0.25)]" onClick={() => exec('strikeThrough')} aria-label="Strikethrough">
                        <Strikethrough className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={() => changeFontSize(-1)} aria-label="Decrease font size">
                        <Type className="w-4 h-4" />
                        <span className="ml-1 text-xs">-</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={() => changeFontSize(1)} aria-label="Increase font size">
                        <Type className="w-4 h-4" />
                        <span className="ml-1 text-xs">+</span>
                      </Button>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <Palette className="w-4 h-4 mr-2 text-muted-foreground" />
                        <input
                          type="color"
                          aria-label="Font color"
                          onChange={(e) => applyColor(e.target.value)}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border border-white/10 p-0"
                        />
                      </div>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={() => exec('insertUnorderedList')} aria-label="Bullet list">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={() => exec('insertOrderedList')} aria-label="Numbered list">
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={handleUndo} aria-label="Undo">
                        <Undo2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-md" onClick={handleRedo} aria-label="Redo">
                        <Redo2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-md"
                        onClick={() => setShowEmojiPicker((s) => !s)}
                        aria-label="Insert emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      {showEmojiPicker && (
                        <div className="absolute z-20 mt-2 p-2 rounded-lg bg-background/95 border border-white/10 grid grid-cols-6 gap-1">
                          {['😀','😁','😂','😊','😍','😎','🤔','👍','👏','🎉','✅','📌','📝','💡','⚠️','❗'].map((e) => (
                            <button
                              key={e}
                              className="text-lg hover:scale-110 transition"
                              onClick={() => { insertEmoji(e); setShowEmojiPicker(false); }}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editable Area */}
                  <ScrollArea className="h-[600px] pr-4">
                    <div
                      ref={editorRef}
                      className="prose prose-sm max-w-none dark:prose-invert focus:outline-none rounded-md p-3 bg-background/40 border border-white/10 min-h-[400px]"
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={saveSelection}
                      onKeyUp={saveSelection}
                      onMouseUp={saveSelection}
                      onInput={(e) => {
                        const newHtml = (e.target as HTMLDivElement).innerHTML;
                        setHtml(newHtml);
                        if (!isRestoringRef.current) pushHistory(newHtml);
                      }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table">
              <div className="space-y-6">
                {/* Participants */}
                <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {meetingData.minutes_json?.participants?.map((participant: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Decisions */}
                {meetingData.minutes_json?.decisions && meetingData.minutes_json.decisions.length > 0 && (
                  <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Decisions Made
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-glow">
                            <TableHead>Decision</TableHead>
                            <TableHead>Responsible</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {meetingData.minutes_json.decisions.map((decision: any, index: number) => (
                            <TableRow key={index} className="border-glow">
                              <TableCell>{decision.decision}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{decision.responsible}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Action Items */}
                {meetingData.minutes_json?.action_items && meetingData.minutes_json.action_items.length > 0 && (
                  <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-glow">
                            <TableHead>Task</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Deadline</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {meetingData.minutes_json.action_items.map((item: any, index: number) => (
                            <TableRow key={index} className="border-glow">
                              <TableCell>{item.task}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.owner}</Badge>
                              </TableCell>
                              <TableCell>
                                {item.deadline || (
                                  <span className="text-muted-foreground">Not specified</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Discussion Points */}
                {meetingData.minutes_json?.discussion_points && meetingData.minutes_json.discussion_points.length > 0 && (
                  <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Discussion Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {meetingData.minutes_json.discussion_points.map((point: any, index: number) => (
                          <div key={index} className="border-l-4 border-primary/50 pl-4">
                            <h4 className="font-semibold text-sm gradient-text mb-1">
                              {point.topic}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {point.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Export Bar */}
      <div className="mt-8 sticky bottom-4">
        <Card className="glow-box bg-card/95 backdrop-blur-xl border-glow">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Export your meeting minutes in multiple formats
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('txt')}
                  className="film-button"
                >
                  TXT
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('docx')}
                  className="film-button"
                >
                  DOCX
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleExport('pdf')}
                  className="glow-box film-button"
                >
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MinutesEditor;