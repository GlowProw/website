import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 日历
 */
export function useCalendarApi() {
    const http = useHttpToken();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 获取当前用户信息
     */
    const get = async (seasonId: string) => {
        try {
            const result = await http.get('calendar/data', {
                params: {
                    season: seasonId
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        get
    }
}
