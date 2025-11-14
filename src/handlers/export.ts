/**
 * Export handler - Generate reports and exports
 */

import type { ExportOptions, ExportFormat } from '../types';

export interface ExportContext {
  supabase: any;
}

export async function exportFeedback(
  input: { sessionId: string; options: ExportOptions },
  context: ExportContext
): Promise<{ success: boolean; data: string; filename: string; mimeType: string }> {
  const { sessionId, options } = input;

  // Get session data
  const { data: session } = await context.supabase
    .from('slidev_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  // Get feedback data based on options
  let reactions = null;
  let questions = null;
  let analytics = null;

  if (options.includeReactions) {
    const { data } = await context.supabase
      .from('slidev_reactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('slide_number');
    reactions = data;
  }

  if (options.includeQuestions) {
    const { data } = await context.supabase
      .from('slidev_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('slide_number');
    questions = data;
  }

  if (options.includeAnalytics) {
    // Generate analytics (simplified)
    analytics = {
      totalReactions: reactions?.length || 0,
      totalQuestions: questions?.length || 0,
      slideCount: session.slide_count,
    };
  }

  // Export based on format
  let exportData: string;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case 'json':
      exportData = JSON.stringify(
        {
          session,
          reactions,
          questions,
          analytics,
        },
        null,
        2
      );
      filename = `feedback-${sessionId}.json`;
      mimeType = 'application/json';
      break;

    case 'csv':
      exportData = generateCSV(session, reactions, questions, options);
      filename = `feedback-${sessionId}.csv`;
      mimeType = 'text/csv';
      break;

    case 'markdown':
      exportData = generateMarkdown(session, reactions, questions, analytics, options);
      filename = `feedback-${sessionId}.md`;
      mimeType = 'text/markdown';
      break;

    case 'pdf':
      // PDF generation would require additional libraries
      // For now, return markdown that can be converted
      exportData = generateMarkdown(session, reactions, questions, analytics, options);
      filename = `feedback-${sessionId}.md`;
      mimeType = 'text/markdown';
      break;

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  return {
    success: true,
    data: exportData,
    filename,
    mimeType,
  };
}

function generateCSV(
  session: any,
  reactions: any[],
  questions: any[],
  options: ExportOptions
): string {
  const rows: string[] = [];
  
  // Header
  rows.push('Type,Slide,Content,User,Timestamp');

  // Add reactions
  if (reactions && options.includeReactions) {
    reactions.forEach((reaction) => {
      rows.push(
        `Reaction,${reaction.slide_number},${reaction.reaction_type},${
          reaction.user_id || 'Anonymous'
        },${reaction.timestamp}`
      );
    });
  }

  // Add questions
  if (questions && options.includeQuestions) {
    questions.forEach((question) => {
      rows.push(
        `Question,${question.slide_number},"${question.question_text}",${
          question.user_id || 'Anonymous'
        },${question.timestamp}`
      );
    });
  }

  return rows.join('\n');
}

function generateMarkdown(
  session: any,
  reactions: any[],
  questions: any[],
  analytics: any,
  options: ExportOptions
): string {
  const sections: string[] = [];

  // Title
  sections.push(`# Feedback Report: ${session.presentation_title}`);
  sections.push('');
  sections.push(`**Session ID:** ${session.id}`);
  sections.push(`**Created:** ${session.created_at}`);
  sections.push(`**Slides:** ${session.slide_count}`);
  sections.push('');

  // Analytics
  if (analytics && options.includeAnalytics) {
    sections.push('## Analytics Summary');
    sections.push('');
    sections.push(`- **Total Reactions:** ${analytics.totalReactions}`);
    sections.push(`- **Total Questions:** ${analytics.totalQuestions}`);
    sections.push('');
  }

  // Reactions by slide
  if (reactions && options.includeReactions && options.groupBySlide) {
    sections.push('## Reactions by Slide');
    sections.push('');

    const grouped = groupBySlide(reactions);
    Object.entries(grouped).forEach(([slide, items]: [string, any[]]) => {
      sections.push(`### Slide ${slide}`);
      const reactionCounts: Record<string, number> = {};
      items.forEach((item) => {
        reactionCounts[item.reaction_type] = (reactionCounts[item.reaction_type] || 0) + 1;
      });
      Object.entries(reactionCounts).forEach(([emoji, count]) => {
        sections.push(`- ${emoji}: ${count}`);
      });
      sections.push('');
    });
  }

  // Questions by slide
  if (questions && options.includeQuestions && options.groupBySlide) {
    sections.push('## Questions by Slide');
    sections.push('');

    const grouped = groupBySlide(questions);
    Object.entries(grouped).forEach(([slide, items]: [string, any[]]) => {
      sections.push(`### Slide ${slide}`);
      items.forEach((question) => {
        sections.push(`- ${question.question_text}`);
        if (question.is_answered) {
          sections.push(`  - ✅ Answered`);
        }
        if (question.upvotes > 0) {
          sections.push(`  - 👍 ${question.upvotes} upvotes`);
        }
      });
      sections.push('');
    });
  }

  return sections.join('\n');
}

function groupBySlide(items: any[]): Record<number, any[]> {
  const grouped: Record<number, any[]> = {};
  items.forEach((item) => {
    const slide = item.slide_number;
    if (!grouped[slide]) {
      grouped[slide] = [];
    }
    grouped[slide].push(item);
  });
  return grouped;
}

export default exportFeedback;
