/**
 * API DTOから画面表示用modelへ変換する境界。
 * adapterでは表示用labelの組み立てと値の検証だけを行い、
 * 点数・順位・統計値の再計算やAPIにないfallbackを追加しない。
 */
export type ApiAdapter<ApiDto, ViewModel> = (dto: ApiDto) => ViewModel;

export const createApiAdapter = <ApiDto, ViewModel>(
  adapter: ApiAdapter<ApiDto, ViewModel>
): ApiAdapter<ApiDto, ViewModel> => adapter;
