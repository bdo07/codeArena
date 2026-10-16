import { Badge } from '@/types';

export interface ChallengeContentTranslation {
  title: string;
  description: string;
  input_description?: string;
  output_description?: string;
  constraints?: string;
}

export const SEEDED_CHALLENGE_TRANSLATIONS_FR: Record<string, ChallengeContentTranslation> = {
  'two-sum': {
    title: 'Somme de deux nombres',
    description:
      "Étant donné un tableau d'entiers `nums` et un entier `target`, renvoyez les indices des deux nombres tels que leur somme soit égale à `target`.\n\nVous pouvez supposer que chaque entrée aura exactement une solution, et vous ne pouvez pas utiliser deux fois le même élément.\n\nVous pouvez renvoyer la réponse dans n'importe quel ordre.",
    input_description:
      "La première ligne contient des nombres séparés par des virgules représentant `nums`. La deuxième ligne contient l'entier `target`.",
    output_description:
      'Renvoyez les deux indices (base 0) séparés par une virgule (ex. `0,1`).',
    constraints:
      '• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Une seule réponse valide existe.',
  },
  'valid-parentheses': {
    title: 'Parenthèses valides',
    description:
      "Étant donné une chaîne `s` contenant uniquement les caractères `'('`, `')'`, `'{'`, `'}'`, `'['` et `']'`, déterminez si la chaîne d'entrée est valide.\n\nUne chaîne d'entrée est valide si :\n1. Les parenthèses ouvertes doivent être fermées par le même type de parenthèses.\n2. Les parenthèses ouvertes doivent être fermées dans le bon ordre.\n3. Chaque parenthèse fermante a une parenthèse ouvrante correspondante du même type.",
    input_description: 'Une seule ligne contenant la chaîne `s`.',
    output_description: 'Renvoyez `true` si la chaîne est valide, sinon `false`.',
    constraints:
      "• 1 <= s.length <= 10^4\n• `s` se compose uniquement de parenthèses '()[]{}'.",
  },
  'longest-substring-without-repeating-characters': {
    title: 'Plus longue sous-chaîne sans répétition',
    description:
      'Étant donné une chaîne `s`, trouvez la longueur de la plus longue sous-chaîne sans caractères répétés.',
    input_description: "Une seule ligne contenant la chaîne d'entrée `s`.",
    output_description:
      'Renvoyez la longueur entière de la plus longue sous-chaîne sans répétition.',
    constraints:
      '• 0 <= s.length <= 5 * 10^4\n• `s` est composé de lettres anglaises, de chiffres, de symboles et d’espaces.',
  },
  'container-with-most-water': {
    title: "Conteneur avec le plus d'eau",
    description:
      "On vous donne un tableau d'entiers `height` de longueur `n`. Il y a `n` lignes verticales tracées telles que les deux extrémités de la ligne `i` sont `(i, 0)` et `(i, height[i])`.\n\nTrouvez deux lignes qui, avec l'axe des x, forment un conteneur qui contient le plus d'eau.\n\nRenvoyez la quantité maximale d'eau qu'un conteneur peut stocker.",
    input_description:
      'Une seule ligne contenant des entiers séparés par des virgules représentant les hauteurs.',
    output_description: "Renvoyez l'aire maximale d'eau sous forme d'un entier unique.",
    constraints:
      '• n == height.length\n• 2 <= n <= 10^5\n• 0 <= height[i] <= 10^4',
  },
  'trapping-rain-water': {
    title: "Piégeage de l'eau de pluie",
    description:
      "Étant donné `n` entiers non négatifs représentant une carte d'élévation où la largeur de chaque barre est 1, calculez la quantité d'eau qu'elle est capable de piéger après la pluie.",
    input_description:
      "Une seule ligne contenant des entiers séparés par des virgules représentant la carte d'élévation.",
    output_description:
      "Renvoyez le nombre total d'unités d'eau piégées sous forme d'un entier.",
    constraints:
      '• n == height.length\n• 1 <= n <= 2 * 10^4\n• 0 <= height[i] <= 10^5',
  },
};

export const SEEDED_TAG_TRANSLATIONS_FR: Record<string, string> = {
  array: 'Tableau',
  string: 'Chaîne',
  'hash-table': 'Table de hachage',
  'two-pointers': 'Deux pointeurs',
  stack: 'Pile',
  'dynamic-programming': 'Programmation dynamique',
  math: 'Mathématiques',
};

export const SEEDED_BADGE_TRANSLATIONS_FR: Record<
  string,
  { name: string; description: string }
> = {
  'first-solve': {
    name: 'Premier Défi Résolu',
    description: 'A réussi son premier défi sur CodeArena avec brio',
  },
  'problem-solver': {
    name: 'Résolveur de Problèmes',
    description: 'A résolu 3 défis algorithmiques ou plus',
  },
  'decathlon-coder': {
    name: 'Codeur Décathlon',
    description: 'A résolu 5 défis ou plus dans plusieurs catégories',
  },
  'apex-master': {
    name: 'Maître de l’Apex',
    description: 'A triomphé d’un défi algorithmique de niveau Difficile',
  },
};

/**
 * Returns translated challenge content if language is French and a translation exists;
 * otherwise preserves the original challenge text unchanged.
 */
export function getTranslatedChallenge<
  T extends {
    slug: string;
    title: string;
    description?: string;
    input_description?: string;
    output_description?: string;
    constraints?: string;
  }
>(challenge: T, language: string): T {
  if (language.startsWith('fr')) {
    const translation = SEEDED_CHALLENGE_TRANSLATIONS_FR[challenge.slug];
    if (translation) {
      return {
        ...challenge,
        title: translation.title || challenge.title,
        ...(challenge.description !== undefined
          ? { description: translation.description || challenge.description }
          : {}),
        ...(challenge.input_description !== undefined
          ? {
              input_description:
                translation.input_description !== undefined
                  ? translation.input_description
                  : challenge.input_description,
            }
          : {}),
        ...(challenge.output_description !== undefined
          ? {
              output_description:
                translation.output_description !== undefined
                  ? translation.output_description
                  : challenge.output_description,
            }
          : {}),
        ...(challenge.constraints !== undefined
          ? {
              constraints:
                translation.constraints !== undefined
                  ? translation.constraints
                  : challenge.constraints,
            }
          : {}),
      };
    }
  }
  return challenge;
}

/**
 * Returns translated badge if language is French and a translation exists.
 */
export function getTranslatedBadge(badge: Badge, language: string): Badge {
  if (language.startsWith('fr')) {
    const translation = SEEDED_BADGE_TRANSLATIONS_FR[badge.slug];
    if (translation) {
      return {
        ...badge,
        name: translation.name,
        description: translation.description,
      };
    }
  }
  return badge;
}

/**
 * Returns translated tag name if available.
 */
export function getTranslatedTagName(slug: string, originalName: string, language: string): string {
  if (language.startsWith('fr') && SEEDED_TAG_TRANSLATIONS_FR[slug]) {
    return SEEDED_TAG_TRANSLATIONS_FR[slug];
  }
  return originalName;
}

/**
 * Maps difficulty values ('Easy', 'Medium', 'Hard') to the appropriate locale display label.
 */
export function getDifficultyLabel(
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert' | string,
  t: (key: string) => string
): string {
  if (difficulty === 'Beginner') return t('difficulty.Beginner');
  if (difficulty === 'Easy') return t('difficulty.Easy');
  if (difficulty === 'Medium') return t('difficulty.Medium');
  if (difficulty === 'Hard') return t('difficulty.Hard');
  if (difficulty === 'Expert') return t('difficulty.Expert');
  return difficulty;
}
