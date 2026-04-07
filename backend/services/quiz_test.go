package services

import (
	"testing"

	"github.com/vjauhari-work/jee/backend/models"
)

func TestQuizConfig_SectionCount(t *testing.T) {
	expectedSections := []string{
		models.SectionBoards11,
		models.SectionBoards12,
		models.SectionJEEMains,
		models.SectionJEEAdvanced,
	}

	if len(QuizConfig) != len(expectedSections) {
		t.Errorf("expected %d sections in QuizConfig, got %d", len(expectedSections), len(QuizConfig))
	}

	for _, section := range expectedSections {
		if _, ok := QuizConfig[section]; !ok {
			t.Errorf("QuizConfig missing entry for section %q", section)
		}
	}
}

func TestQuizConfig_QuestionCounts(t *testing.T) {
	tests := []struct {
		section  string
		expected int
	}{
		{models.SectionBoards11, 25},
		{models.SectionBoards12, 25},
		{models.SectionJEEMains, 30},
		{models.SectionJEEAdvanced, 20},
	}

	for _, tt := range tests {
		cfg, ok := QuizConfig[tt.section]
		if !ok {
			t.Errorf("QuizConfig missing entry for section %q", tt.section)
			continue
		}
		if cfg.QuestionCount != tt.expected {
			t.Errorf("QuizConfig[%q].QuestionCount = %d, want %d", tt.section, cfg.QuestionCount, tt.expected)
		}
	}
}

func TestQuizConfig_TimeLimits(t *testing.T) {
	for section, cfg := range QuizConfig {
		if cfg.TimeLimitMins != 60 {
			t.Errorf("QuizConfig[%q].TimeLimitMins = %d, want 60", section, cfg.TimeLimitMins)
		}
	}
}

func TestPYQYearTimeLimitMins(t *testing.T) {
	if PYQYearTimeLimitMins != 180 {
		t.Errorf("PYQYearTimeLimitMins = %d, want 180", PYQYearTimeLimitMins)
	}
}
