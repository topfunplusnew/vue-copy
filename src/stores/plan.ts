import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import type { 
  IPlan, 
  IPlanCreateReq, 
  IPlanUpdateReq, 
  IPlanSearchReq,
  IPlanPage,
  IPlace,
  IDay,
  IAttraction 
} from '@/types/plan';
import { 
  planCreate, 
  planUpdate, 
  planGet, 
  planDelete, 
  planSearch, 
  getMyPlans 
} from '@/services/api';
import { INIT_PLAN, INIT_DAY, INIT_ATTRACTION } from '@/constants/plan';

export const usePlanStore = defineStore('plan', () => {
  // ========== 状态 ==========
  const currentPlan = ref<IPlan | null>(null);
  const myPlans = ref<IPlan[]>([]);
  const searchResults = ref<IPlan[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);

  // ========== 计算属性 ==========
  const hasCurrentPlan = computed(() => !!currentPlan.value);
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

  // ========== 创建计划 ==========
  const createPlan = async (planData: IPlanCreateReq): Promise<boolean> => {
    try {
      isCreating.value = true;
      const response = await planCreate(planData);
      
      if (response.data) {
        currentPlan.value = response.data;
        ElMessage.success('Plan created successfully');
        // 重新加载我的计划列表
        await loadMyPlans();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create Plan error:', error);
      ElMessage.error('Create Plan error');
      return false;
    } finally {
      isCreating.value = false;
    }
  };

  // ========== 更新计划 ==========
  const updatePlan = async (planData: IPlanUpdateReq): Promise<boolean> => {
    try {
      isUpdating.value = true;
      const response = await planUpdate(planData);
      
      if (response.data) {
        currentPlan.value = response.data;
        ElMessage.success('Plan updated successfully');
        // 更新列表中的对应项
        const index = myPlans.value.findIndex(p => p.id === planData.id);
        if (index !== -1) {
          myPlans.value[index] = response.data;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update Plan error:', error);
      ElMessage.error('Update Plan error');
      return false;
    } finally {
      isUpdating.value = false;
    }
  };

  // ========== 获取计划详情 ==========
  const loadPlan = async (id: number): Promise<boolean> => {
    try {
      isLoading.value = true;
      const response = await planGet(id);
      
      if (response.data) {
        currentPlan.value = response.data;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Load Plan error:', error);
      ElMessage.error('Load Plan error');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // ========== 删除计划 ==========
  const deletePlan = async (id: number): Promise<boolean> => {
    try {
      await planDelete(id);
      
      // 从列表中移除
      myPlans.value = myPlans.value.filter(p => p.id !== id);
      
      // 如果删除的是当前计划，清空当前计划
      if (currentPlan.value?.id === id) {
        currentPlan.value = null;
      }
      
      ElMessage.success('Plan deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete Plan error:', error);
      ElMessage.error('Delete Plan error');
      return false;
    }
  };

  // ========== 加载我的计划列表 ==========
  const loadMyPlans = async (params: IPlanSearchReq = {}): Promise<void> => {
    try {
      isLoading.value = true;
      const searchParams = {
        ...params,
        page: currentPage.value,
        limit: pageSize.value
      };
      
      const response = await getMyPlans(searchParams);
      
      if (response.data) {
        const planPage = response.data as IPlanPage;
        myPlans.value = planPage.items;
        total.value = planPage.total;
      }
    } catch (error) {
      console.error('Load Plan List error:', error);
      ElMessage.error('Load Plan List error');
    } finally {
      isLoading.value = false;
    }
  };

  // ========== 搜索计划 ==========
  const searchPlans = async (params: IPlanSearchReq): Promise<void> => {
    try {
      isLoading.value = true;
      const response = await planSearch(params);
      
      if (response.data) {
        const planPage = response.data as IPlanPage;
        searchResults.value = planPage.items;
        total.value = planPage.total;
      }
    } catch (error) {
      console.error('Search Plan error:', error);
      ElMessage.error('Search Plan error');
    } finally {
      isLoading.value = false;
    }
  };

  // ========== 计划操作辅助函数 ==========
  
  // 创建新的空计划
  const createNewPlan = (): IPlanCreateReq => {
    return { ...INIT_PLAN };
  };

  // 添加新的一天
  const addDay = (dayNumber: number): IDay => {
    return {
      ...INIT_DAY,
      day: dayNumber
    };
  };

  // 添加新的景点安排
  const addAttraction = (dayIndex: number, time: number = 9): IAttraction => {
    return {
      ...INIT_ATTRACTION,
      time
    };
  };

  // 计算计划总预算
  const calculateTotalBudget = (plan: IPlan): number => {
    return plan.days.reduce((total, day) => {
      return total + day.attractions.reduce((dayTotal, attraction) => {
        return dayTotal + attraction.budget;
      }, 0);
    }, 0);
  };

  // 计算计划持续天数
  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // ========== 重置状态 ==========
  const resetStore = () => {
    currentPlan.value = null;
    myPlans.value = [];
    searchResults.value = [];
    isLoading.value = false;
    isCreating.value = false;
    isUpdating.value = false;
    total.value = 0;
    currentPage.value = 1;
  };
    
  return {
    // 状态
    currentPlan,
    myPlans,
    searchResults,
    isLoading,
    isCreating,
    isUpdating,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    hasCurrentPlan,
    totalPages,
    
    // 主要操作
    createPlan,
    updatePlan,
    loadPlan,
    deletePlan,
    loadMyPlans,
    searchPlans,
    
    // 辅助函数
    createNewPlan,
    addDay,
    addAttraction,
    calculateTotalBudget,
    calculateDuration,
    resetStore
  };
});