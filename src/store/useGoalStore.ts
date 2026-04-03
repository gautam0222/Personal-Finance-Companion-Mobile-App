import { create } from 'zustand';
import { Goal } from '../types';
import { Storage } from '../utils/storage';

function genId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type NewGoalInput = Omit<
  Goal,
  'id' | 'createdAt' | 'currentAmount' | 'isCompleted' | 'completedAt' | 'isActive'
> & {
  isActive?: boolean;
};

interface GoalStore {
  goals: Goal[];
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addGoal: (data: NewGoalInput) => Promise<Goal>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const saved = await Storage.get<Goal[]>(Storage.KEYS.GOALS);
      set({ goals: saved ?? [], isHydrated: true });
    } catch {
      set({ goals: [], isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: async (data) => {
    const goal: Goal = {
      ...data,
      id: genId(),
      currentAmount: 0,
      isActive: data.isActive ?? true,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const next = [goal, ...get().goals];
    set({ goals: next });
    await Storage.set(Storage.KEYS.GOALS, next);
    return goal;
  },

  updateGoalProgress: async (id, amount) => {
    const next = get().goals.map((goal) => {
      if (goal.id !== id) return goal;

      const currentAmount = Math.max(0, goal.currentAmount + amount);
      const isCompleted = currentAmount >= goal.targetAmount;

      return {
        ...goal,
        currentAmount: Math.min(currentAmount, goal.targetAmount),
        isActive: isCompleted ? false : goal.isActive,
        isCompleted,
        completedAt: isCompleted ? goal.completedAt ?? new Date().toISOString() : undefined,
      };
    });

    set({ goals: next });
    await Storage.set(Storage.KEYS.GOALS, next);
  },

  deleteGoal: async (id) => {
    const next = get().goals.filter((goal) => goal.id !== id);
    set({ goals: next });
    await Storage.set(Storage.KEYS.GOALS, next);
  },

  completeGoal: async (id) => {
    const next = get().goals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            currentAmount: goal.targetAmount,
            isActive: false,
            isCompleted: true,
            completedAt: goal.completedAt ?? new Date().toISOString(),
          }
        : goal,
    );
    set({ goals: next });
    await Storage.set(Storage.KEYS.GOALS, next);
  },

  toggleActive: async (id) => {
    const next = get().goals.map((goal) =>
      goal.id === id ? { ...goal, isActive: !goal.isActive } : goal,
    );
    set({ goals: next });
    await Storage.set(Storage.KEYS.GOALS, next);
  },

  getActiveGoals: () => get().goals.filter((goal) => goal.isActive && !goal.isCompleted),
  getCompletedGoals: () => get().goals.filter((goal) => goal.isCompleted),
}));
