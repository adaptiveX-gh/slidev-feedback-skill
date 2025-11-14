/**
 * Settings Panel - Widget customization options
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@amagen/ui/card';
import { Button } from '@amagen/ui/button';
import { Label } from '@amagen/ui/label';
import { Switch } from '@amagen/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@amagen/ui/select';
import { Slider } from '@amagen/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@amagen/ui/tabs';
import { Badge } from '@amagen/ui/badge';
import { Settings, Palette, Volume2, Eye } from 'lucide-react';
import type { SlidevFeedbackSettings } from '../types';

interface SettingsPanelProps {
  settings: SlidevFeedbackSettings;
  onUpdate: (settings: Partial<SlidevFeedbackSettings>) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleUpdate = (update: Partial<SlidevFeedbackSettings>) => {
    const newSettings = { ...localSettings, ...update };
    setLocalSettings(newSettings);
    onUpdate(update);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Widget Settings
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={localSettings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => 
                    handleUpdate({ theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Widget Size</Label>
                <Select 
                  value={localSettings.size}
                  onValueChange={(value: 'compact' | 'normal' | 'large') => 
                    handleUpdate({ size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select 
                  value={localSettings.position}
                  onValueChange={(value: 'top' | 'bottom' | 'floating') => 
                    handleUpdate({ position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="floating">Floating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reaction Animation</Label>
                <Select 
                  value={localSettings.reactionAnimation}
                  onValueChange={(value: 'none' | 'bounce' | 'fade') => 
                    handleUpdate({ reactionAnimation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Label htmlFor="sound">Enable Sound</Label>
                </div>
                <Switch
                  id="sound"
                  checked={localSettings.enableSound}
                  onCheckedChange={(checked) => 
                    handleUpdate({ enableSound: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <Label htmlFor="autohide">Auto Hide Widget</Label>
                </div>
                <Switch
                  id="autohide"
                  checked={localSettings.autoHide}
                  onCheckedChange={(checked) => 
                    handleUpdate({ autoHide: checked })
                  }
                />
              </div>

              {localSettings.autoHide && (
                <div className="space-y-2">
                  <Label>Auto Hide Delay (seconds)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={1}
                      max={30}
                      step={1}
                      value={[localSettings.autoHideDelay]}
                      onValueChange={([value]) => 
                        handleUpdate({ autoHideDelay: value })
                      }
                      className="flex-1"
                    />
                    <Badge variant="secondary">
                      {localSettings.autoHideDelay}s
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="participants">Show Participant Count</Label>
                <Switch
                  id="participants"
                  checked={localSettings.showParticipantCount}
                  onCheckedChange={(checked) => 
                    handleUpdate({ showParticipantCount: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="slide">Show Slide Number</Label>
                <Switch
                  id="slide"
                  checked={localSettings.showSlideNumber}
                  onCheckedChange={(checked) => 
                    handleUpdate({ showSlideNumber: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
