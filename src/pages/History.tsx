import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Search, Filter, Download, Share2, Star, Trash2, Eye, Clock, Users, Tag, FileText, Play, Grid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";

const History = () => {
  const [view, setView] = useState<'timeline' | 'table'>('timeline');
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', searchQuery, dateFilter, tagFilter, sortBy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('meetings')
        .select(`
          *,
          favorites (user_id),
          meeting_versions (id, version, created_at),
          activity_log (action, created_at)
        `)
        .is('deleted_at', null)
        .order(sortBy, { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,participants.cs.{${searchQuery}}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for meetings:`, selectedMeetings);
    // Implement bulk actions
  };

  const PreviewDrawer = ({ meeting }: { meeting: any }) => (
    <SheetContent className="w-full sm:max-w-lg bg-card/95 backdrop-blur-xl border-glow">
      <SheetHeader>
        <SheetTitle className="gradient-text">{meeting.title}</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">{new Date(meeting.date).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Participants:</span>
            <p className="font-medium">{meeting.participants.length}</p>
          </div>
        </div>
        
        {meeting.participants.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Participants:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {meeting.participants.map((participant: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {meeting.tags.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {meeting.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-glow">
          <div className="flex gap-2">
            <Button size="sm" className="glow-box film-button">
              <Eye className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  );

  return (
    <div className="min-h-screen bg-background film-grain">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-poppins font-bold gradient-text mb-2">Meeting History</h1>
          <p className="text-muted-foreground">Manage and explore all your meeting minutes</p>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-glow"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="bg-card/50 border-glow">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-card/50 border-glow">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Modified</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="date">Meeting Date</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={view === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeline')}
              className="flex-1"
            >
              <Grid className="w-4 h-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('table')}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMeetings.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm text-primary font-medium">
              {selectedMeetings.length} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('share')}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <Tabs value={view} onValueChange={(v) => setView(v as 'timeline' | 'table')}>
          <TabsContent value="timeline" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse glow-box bg-card/50">
                    <div className="h-48 bg-muted/20 rounded-lg"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetings?.map((meeting) => (
                  <Card key={meeting.id} className="glow-box film-dissolve bg-card/80 backdrop-blur-sm border-glow hover:shadow-glow transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Checkbox
                          checked={selectedMeetings.includes(meeting.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMeetings([...selectedMeetings, meeting.id]);
                            } else {
                              setSelectedMeetings(selectedMeetings.filter(id => id !== meeting.id));
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          {meeting.favorites?.length > 0 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-poppins gradient-text line-clamp-2">
                        {meeting.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(meeting.updated_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.participants.length}
                        </div>
                      </div>
                      
                      {meeting.participants.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {meeting.participants.slice(0, 3).map((participant: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {participant}
                            </Badge>
                          ))}
                          {meeting.participants.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{meeting.participants.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="sm" variant="outline" className="film-button">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </SheetTrigger>
                          <PreviewDrawer meeting={meeting} />
                        </Sheet>
                        <Button size="sm" className="glow-box film-button">
                          <Play className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table">
            <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
              <Table>
                <TableHeader>
                  <TableRow className="border-glow">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMeetings.length === meetings?.length && meetings?.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMeetings(meetings?.map(m => m.id) || []);
                          } else {
                            setSelectedMeetings([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings?.map((meeting) => (
                    <TableRow key={meeting.id} className="border-glow hover:bg-muted/5">
                      <TableCell>
                        <Checkbox
                          checked={selectedMeetings.includes(meeting.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMeetings([...selectedMeetings, meeting.id]);
                            } else {
                              setSelectedMeetings(selectedMeetings.filter(id => id !== meeting.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{meeting.title}</TableCell>
                      <TableCell>{new Date(meeting.date).toLocaleDateString()}</TableCell>
                      <TableCell>{meeting.participants.length}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {meeting.tags.slice(0, 2).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {meeting.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{meeting.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(meeting.updated_at), { addSuffix: true })}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;