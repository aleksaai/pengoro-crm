import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConversionData {
  stage: string;
  nextStage: string;
  entriesCount: number;
  conversionsCount: number;
  conversionRate: number;
}

export function PipelineConversionAnalytics() {
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversionData();
  }, []);

  const fetchConversionData = async () => {
    try {
      setLoading(true);
      
      // Get all leads and their status changes from history
      const { data: historyData, error } = await supabase
        .from('lead_history')
        .select('lead_id, new_values, created_at')
        .or('action.eq.Lead updated,action.eq.Lead status changed')
        .not('new_values', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Track lead progressions through stages
      const leadProgressions = new Map<string, string[]>();
      
      // Process history to track each lead's journey
      historyData?.forEach(entry => {
        const leadId = entry.lead_id;
        const newValues = entry.new_values as any;
        const newStatus = newValues?.status;
        
        if (newStatus && typeof newStatus === 'string') {
          if (!leadProgressions.has(leadId)) {
            leadProgressions.set(leadId, []);
          }
          leadProgressions.get(leadId)?.push(newStatus);
        }
      });

      // Define pipeline stages in order
      const pipelineStages = [
        'Discovery Call Booked',
        'Second Meeting Booked', 
        'Follow-Up Scheduled',
        'Closing Call Scheduled',
        'Won'
      ];

      // Calculate conversions between stages
      const conversions: ConversionData[] = [];
      
      for (let i = 0; i < pipelineStages.length - 1; i++) {
        const currentStage = pipelineStages[i];
        const nextStage = pipelineStages[i + 1];
        
        let entriesCount = 0;
        let conversionsCount = 0;
        
        // Count leads that reached current stage and how many progressed to next
        leadProgressions.forEach((progression) => {
          const currentStageIndex = progression.indexOf(currentStage);
          if (currentStageIndex !== -1) {
            entriesCount++;
            
            // Check if they progressed to the next stage after reaching current stage
            const laterProgression = progression.slice(currentStageIndex);
            if (laterProgression.includes(nextStage)) {
              conversionsCount++;
            }
          }
        });
        
        const conversionRate = entriesCount > 0 ? Math.round((conversionsCount / entriesCount) * 100) : 0;
        
        conversions.push({
          stage: currentStage,
          nextStage: nextStage,
          entriesCount,
          conversionsCount,
          conversionRate
        });
      }

      setConversionData(conversions);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (conversionRate: number) => {
    if (conversionRate >= 70) return "text-green-600 bg-green-50 border-green-200";
    if (conversionRate >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const formatStageName = (stage: string) => {
    const stageMap: Record<string, string> = {
      'Discovery Call Booked': 'Discovery Call',
      'Second Meeting Booked': 'Second Meeting',
      'Follow-Up Scheduled': 'Follow-Up',
      'Closing Call Scheduled': 'Closing Call',
      'Won': 'Customer Won'
    };
    return stageMap[stage] || stage;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="w-5 h-5 text-primary" />
            Pipeline Conversion Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="w-5 h-5 text-primary" />
          Pipeline Conversion Rates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track how leads progress through each sales pipeline stage
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversionData.map((conversion, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {formatStageName(conversion.stage)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {formatStageName(conversion.nextStage)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{conversion.conversionsCount}/{conversion.entriesCount} leads</span>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStageColor(conversion.conversionRate)}`}>
                {conversion.conversionRate}%
              </div>
            </div>
          ))}
          
          {conversionData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversion data available yet.</p>
              <p className="text-xs mt-1">Conversions will appear as leads progress through the pipeline.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}