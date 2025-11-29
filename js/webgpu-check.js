// Check WebGPU support
export function checkWebGPUSupport() {
    if (!navigator.gpu) {
        return {
            supported: false,
            error: 'WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+ for the best experience.'
        };
    }
    return { supported: true };
}

export async function checkWebGPUDevice() {
    try {
        if (!navigator.gpu) {
            throw new Error('WebGPU not available');
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('No WebGPU adapter found');
        }
        return { supported: true, adapter };
    } catch (error) {
        return {
            supported: false,
            error: 'WebGPU device check failed. Your GPU may not support WebGPU.'
        };
    }
}
