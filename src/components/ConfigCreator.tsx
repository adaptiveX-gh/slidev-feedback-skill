/**
 * Config Creator Component
 *
 * Configuration wizard for creating Slidev feedback widget instances.
 * Runs in the dashboard context during widget creation flow.
 *
 * Features:
 * - Presentation metadata input
 * - Reaction emoji customization
 * - Widget display settings
 * - Theme configuration
 * - Live preview
 * - Validation
 */

import { useState, useEffect } from 'react';
import { Button } from '@amagen/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@amagen/ui/card';
import { Input } from '@amagen/ui/input';
import { Label } from '@amagen/ui/label';
import { Badge } from '@amagen/ui/badge';
import { cn } from '@amagen/ui/utils';
import { Slider } from '@amagen/ui/slider';
import { Switch } from '@amagen/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@amagen/ui/tabs';
import {
  Plus,
  X,
  Eye,
  Settings,
  Palette,
  Zap,
  AlertCircle,
} from 'lucide-react';

export interface ConfigCreatorProps {
  /** Callback when configuration is completed */
  onConfigComplete: (config: WidgetConfiguration) => void;

  /** Initial configuration (for editing) */
  initialConfig?: Partial<WidgetConfiguration>;

  /** Preview mode */
  showPreview?: boolean;
}

export interface WidgetConfiguration {
  presentationTitle: string;
  totalSlides: number;
  allowedReactions: string[];
  theme: 'light' | 'dark' | 'auto';
  showParticipantCount: boolean;
  reactionSize: 'small' | 'medium' | 'large';
  enableSound: boolean;
  autoAdvanceSlides: boolean;
  sessionTimeout: number; // minutes
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '🤔', '👏', '🎉'];

const EMOJI_PRESETS = {
  engagement: ['👍', '👎', '❤️', '🔥', '💯', '✨'],
  emotions: ['😊', '😂', '🤔', '😮', '👏', '🎉'],
  academic: ['✅', '❓', '💡', '📝', '🎯', '⭐'],
  business: ['💼', '📊', '💰', '🚀', '✨', '👍'],
  custom: [],
};

/**
 * Config Creator - Widget Configuration Wizard
 */
export function ConfigCreator({
  onConfigComplete,
  initialConfig,
  showPreview = true,
}: ConfigCreatorProps) {
  // Configuration state
  const [presentationTitle, setPresentationTitle] = useState(
    initialConfig?.presentationTitle || ''
  );
  const [totalSlides, setTotalSlides] = useState(initialConfig?.totalSlides || 10);
  const [allowedReactions, setAllowedReactions] = useState<string[]>(
    initialConfig?.allowedReactions || DEFAULT_REACTIONS
  );
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(
    initialConfig?.theme || 'auto'
  );
  const [showParticipantCount, setShowParticipantCount] = useState(
    initialConfig?.showParticipantCount ?? true
  );
  const [reactionSize, setReactionSize] = useState<'small' | 'medium' | 'large'>(
    initialConfig?.reactionSize || 'medium'
  );
  const [enableSound, setEnableSound] = useState(initialConfig?.enableSound ?? false);
  const [autoAdvanceSlides, setAutoAdvanceSlides] = useState(
    initialConfig?.autoAdvanceSlides ?? false
  );
  const [sessionTimeout, setSessionTimeout] = useState(initialConfig?.sessionTimeout || 120);

  // UI state
  const [customEmoji, setCustomEmoji] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof EMOJI_PRESETS>('engagement');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate configuration
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!presentationTitle.trim()) {
      newErrors.presentationTitle = 'Presentation title is required';
    }

    if (totalSlides < 1 || totalSlides > 1000) {
      newErrors.totalSlides = 'Total slides must be between 1 and 1000';
    }

    if (allowedReactions.length < 2) {
      newErrors.allowedReactions = 'At least 2 reactions are required';
    }

    if (allowedReactions.length > 12) {
      newErrors.allowedReactions = 'Maximum 12 reactions allowed';
    }

    if (sessionTimeout < 5 || sessionTimeout > 480) {
      newErrors.sessionTimeout = 'Session timeout must be between 5 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Add custom emoji
   */
  const addCustomEmoji = () => {
    const emoji = customEmoji.trim();
    if (emoji && !allowedReactions.includes(emoji)) {
      if (allowedReactions.length >= 12) {
        setErrors({ ...errors, allowedReactions: 'Maximum 12 reactions allowed' });
        return;
      }
      setAllowedReactions([...allowedReactions, emoji]);
      setCustomEmoji('');
      setErrors({ ...errors, allowedReactions: '' });
    }
  };

  /**
   * Remove emoji
   */
  const removeEmoji = (emoji: string) => {
    setAllowedReactions(allowedReactions.filter((e) => e !== emoji));
  };

  /**
   * Apply emoji preset
   */
  const applyPreset = (preset: keyof typeof EMOJI_PRESETS) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setAllowedReactions(EMOJI_PRESETS[preset]);
    }
  };

  /**
   * Handle configuration completion
   */
  const handleComplete = () => {
    if (!validate()) {
      return;
    }

    const config: WidgetConfiguration = {
      presentationTitle,
      totalSlides,
      allowedReactions,
      theme,
      showParticipantCount,
      reactionSize,
      enableSound,
      autoAdvanceSlides,
      sessionTimeout,
    };

    onConfigComplete(config);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Settings className="h-4 w-4 mr-2" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="reactions">
            <Zap className="h-4 w-4 mr-2" />
            Reactions
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Details</CardTitle>
              <CardDescription>Basic information about your presentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presentation Title */}
              <div className="space-y-2">
                <Label htmlFor="presentation-title">
                  Presentation Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="presentation-title"
                  placeholder="e.g., Introduction to Machine Learning"
                  value={presentationTitle}
                  onChange={(e) => setPresentationTitle(e.target.value)}
                  className={cn(errors.presentationTitle && 'border-destructive')}
                />
                {errors.presentationTitle && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.presentationTitle}
                  </p>
                )}
              </div>

              {/* Total Slides */}
              <div className="space-y-2">
                <Label htmlFor="total-slides">
                  Total Slides <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="total-slides"
                  type="number"
                  min="1"
                  max="1000"
                  value={totalSlides}
                  onChange={(e) => setTotalSlides(parseInt(e.target.value) || 10)}
                  className={cn(errors.totalSlides && 'border-destructive')}
                />
                {errors.totalSlides && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.totalSlides}
                  </p>
                )}
              </div>

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Session Timeout (minutes)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="session-timeout"
                    min={5}
                    max={480}
                    step={5}
                    value={[sessionTimeout]}
                    onValueChange={([value]) => setSessionTimeout(value)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16 text-right">
                    {sessionTimeout}m
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Widget will automatically close after this duration
                </p>
              </div>

              {/* Auto Advance Slides */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-advance Slides</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically sync audience widgets with presenter
                  </p>
                </div>
                <Switch checked={autoAdvanceSlides} onCheckedChange={setAutoAdvanceSlides} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reactions Settings */}
        <TabsContent value="reactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reaction Emojis</CardTitle>
              <CardDescription>
                Choose which reactions your audience can use (2-12 reactions)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Emoji Presets */}
              <div className="space-y-2">
                <Label>Emoji Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(EMOJI_PRESETS) as Array<keyof typeof EMOJI_PRESETS>)
                    .filter((key) => key !== 'custom')
                    .map((preset) => (
                      <Button
                        key={preset}
                        variant={selectedPreset === preset ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="justify-start"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Current Reactions */}
              <div className="space-y-2">
                <Label>Selected Reactions ({allowedReactions.length}/12)</Label>
                <div className="flex flex-wrap gap-2">
                  {allowedReactions.map((emoji) => (
                    <Badge
                      key={emoji}
                      variant="secondary"
                      className="text-2xl px-3 py-2 cursor-pointer hover:bg-destructive/10"
                      onClick={() => removeEmoji(emoji)}
                    >
                      {emoji}
                      <X className="h-3 w-3 ml-2" />
                    </Badge>
                  ))}
                </div>
                {errors.allowedReactions && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.allowedReactions}
                  </p>
                )}
              </div>

              {/* Add Custom Emoji */}
              <div className="space-y-2">
                <Label htmlFor="custom-emoji">Add Custom Emoji</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-emoji"
                    placeholder="Paste emoji here"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    maxLength={2}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addCustomEmoji}
                    disabled={!customEmoji.trim() || allowedReactions.length >= 12}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a selected emoji above to remove it
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Appearance</CardTitle>
              <CardDescription>Customize how the widget looks to your audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reaction Size */}
              <div className="space-y-2">
                <Label>Reaction Button Size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={reactionSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReactionSize(size)}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Show Participant Count */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Participant Count</Label>
                  <p className="text-xs text-muted-foreground">
                    Display how many people are viewing
                  </p>
                </div>
                <Switch
                  checked={showParticipantCount}
                  onCheckedChange={setShowParticipantCount}
                />
              </div>

              {/* Enable Sound */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound when reactions are sent
                  </p>
                </div>
                <Switch checked={enableSound} onCheckedChange={setEnableSound} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Eye className="h-5 w-5 inline mr-2" />
              Preview
            </CardTitle>
            <CardDescription>See how your widget configuration looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-accent/20">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">{presentationTitle || 'Your Presentation'}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {allowedReactions.map((emoji) => (
                    <div
                      key={emoji}
                      className={cn(
                        'border rounded-lg flex items-center justify-center bg-background',
                        reactionSize === 'small' && 'h-12 w-12 text-xl',
                        reactionSize === 'medium' && 'h-16 w-16 text-2xl',
                        reactionSize === 'large' && 'h-20 w-20 text-3xl'
                      )}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {showParticipantCount && '👥 Participant count will appear here'}
                  {enableSound && ' • 🔊 Sound enabled'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleComplete}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}

export default ConfigCreator;
