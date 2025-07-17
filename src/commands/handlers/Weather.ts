import { BaseCommand, CommandArgs } from "../base/BaseCommand";
import axios from "axios";
import config from "@/configs/env";
import { userStateManager } from "@/utils/userStateManager";

interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  name: string;
}

interface GeoCodeResponse {
  name: string; // 도시 이름
  lat: number; // 위도
  lon: number; // 경도
  country: string; // 국가
  local_names?: { [key: string]: string }; // 로컬 이름들
}

export class WeatherCommand extends BaseCommand {
  get name(): string {
    return "/weather";
  }

  get description(): string {
    return "날씨 정보";
  }

  async execute({ value, chatId, userId, bot }: CommandArgs): Promise<string> {
    if (!userId) {
      return "❌ 사용자 정보를 확인할 수 없습니다.";
    }

    const currentState = userStateManager.getUserState(userId, chatId);

    // 인라인 키보드에서 도시 선택한 경우 (value가 숫자인 경우)
    if (
      value &&
      /^\d+$/.test(value) &&
      currentState &&
      currentState.currentCommand === "/weather" &&
      currentState.step === 2
    ) {
      return this.handleCitySelection(value, currentState, chatId, userId);
    }

    if (!currentState) {
      return this.handleNewWeatherRequest(value, chatId, userId, bot);
    }

    return this.handleExistingState(currentState, value, chatId, userId, bot);
  }

  private async handleNewWeatherRequest(
    value: string | undefined,
    chatId: number,
    userId: string,
    bot: any
  ): Promise<string> {
    if (value) {
      // 바로 도시명이 주어진 경우
      const result = await this.getWeatherInfo(value, chatId, bot);

      // 여러 도시가 검색된 경우 상태 저장
      if (!result) {
        await this.saveMultipleCitiesState(value, chatId, userId);
      }

      return result;
    } else {
      // 대화형 모드 시작
      userStateManager.setUserState(userId, chatId, "/weather", 1);
      return `🌤️ 날씨 정보를 조회합니다.

📍 어느 도시의 날씨를 확인하시겠어요?
도시명을 입력해주세요 (예: 서울, 부산, 제주)

💡 취소하려면 /cancel 을 입력하세요.`;
    }
  }

  private async handleExistingState(
    currentState: any,
    value: string | undefined,
    chatId: number,
    userId: string,
    bot: any
  ): Promise<string> {
    if (currentState.currentCommand !== "/weather") {
      userStateManager.clearUserState(userId, chatId);
      return "❌ 오류가 발생했습니다. 다시 시도해주세요.";
    }

    if (value === "cancel") {
      userStateManager.clearUserState(userId, chatId);
      return "❌ 날씨 조회를 취소했습니다.";
    }

    if (currentState.step === 1) {
      return this.handleCityInput(value, chatId, userId, bot);
    }

    if (currentState.step === 2) {
      return this.handleCitySelection(value, currentState, chatId, userId);
    }

    userStateManager.clearUserState(userId, chatId);
    return "❌ 오류가 발생했습니다. 다시 시도해주세요.";
  }

  private async handleCityInput(
    value: string | undefined,
    chatId: number,
    userId: string,
    bot: any
  ): Promise<string> {
    const cityInput = value || "서울";
    const result = await this.getWeatherInfo(cityInput, chatId, bot);

    // 여러 도시가 검색된 경우 상태 업데이트
    if (!result) {
      await this.saveMultipleCitiesState(cityInput, chatId, userId);
    } else if (result.startsWith("❌")) {
      // 에러 메시지인 경우 상태 유지 (사용자가 다시 입력할 수 있도록)
    } else {
      // 성공적으로 날씨 정보를 가져온 경우 상태 클리어
      userStateManager.clearUserState(userId, chatId);
    }

    return result;
  }

  private async handleCitySelection(
    value: string | undefined,
    currentState: any,
    chatId: number,
    userId: string
  ): Promise<string> {
    const selectedIndex = parseInt(value || "1") - 1;
    const cities = currentState.data.cities as GeoCodeResponse[];

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= cities.length
    ) {
      return `❌ 잘못된 진행 입니다. 주어진 보기에서 선택 해 주세요!`;
    }

    const selectedCity = cities[selectedIndex];
    userStateManager.clearUserState(userId, chatId);

    return this.getWeatherByLocation(selectedCity);
  }

  private async saveMultipleCitiesState(
    cityInput: string,
    chatId: number,
    userId: string
  ): Promise<void> {
    const API_KEY = config.openWeatherApiKey;
    const geoResponse = await axios.get<GeoCodeResponse[]>(
      `http://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=3&appid=${API_KEY}`
    );

    userStateManager.setUserState(userId, chatId, "/weather", 2, {
      cities: geoResponse.data,
      searchTerm: cityInput
    });
  }

  private async getWeatherInfo(
    city: string,
    chatId: number,
    bot: any
  ): Promise<string> {
    try {
      // OpenWeatherMap API 사용 (무료 API)
      const API_KEY = config.openWeatherApiKey;

      if (!API_KEY) {
        return "🌤️ 날씨 API 키가 설정되지 않았습니다.\n관리자에게 문의해주세요.";
      }

      // 1단계: GeoCoding API로 위도/경도 가져오기
      const geoResponse = await axios.get<GeoCodeResponse[]>(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=3&appid=${API_KEY}`
      );

      const geoData = geoResponse.data;

      if (!geoData || geoData.length === 0) {
        return `❌ '${city}' 도시를 찾을 수 없습니다.\n정확한 도시명을 입력해주세요.`;
      }

      // 여러 도시가 검색된 경우 인라인 키보드로 선택하도록 함
      if (geoData.length > 1) {
        await this.sendCitySelectionMessage(geoData, city, chatId, bot);
        return null;
      }

      // 단일 도시인 경우 바로 날씨 정보 조회
      const location = geoData[0];
      return this.getWeatherByLocation(location);
    } catch (error) {
      console.error("Weather API error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return `❌ '${city}' 도시를 찾을 수 없습니다.\n정확한 도시명을 입력해주세요.`;
        } else if (error.response?.status === 401) {
          return "❌ 날씨 API 키가 유효하지 않습니다.\n관리자에게 문의해주세요.";
        }
      }

      return `❌ 날씨 정보를 가져오는데 실패했습니다.\n잠시 후 다시 시도해주세요.`;
    }
  }

  private async sendCitySelectionMessage(
    cities: GeoCodeResponse[],
    searchTerm: string,
    chatId: number,
    bot: any
  ): Promise<void> {
    const message = `🌍 '<b>${searchTerm}</b>' 검색 결과가 여러 개 있습니다.\n원하는 도시를 선택해주세요:`;

    const keyboard = cities.map((city, index) => {
      const cityName = city.local_names?.ko || city.name;
      const countryFlag = this.getCountryFlag(city.country);
      return [
        {
          text: `${cityName} ${countryFlag}`,
          callback_data: `weather_select_${index}`
        }
      ];
    });

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  private async getWeatherByLocation(
    location: GeoCodeResponse
  ): Promise<string> {
    try {
      const API_KEY = config.openWeatherApiKey;

      console.log(`GeoCoding 결과: ${JSON.stringify(location)}`);

      // 위도/경도로 날씨 정보 가져오기
      const weatherResponse = await axios.get<WeatherResponse>(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=kr`
      );

      const weather = weatherResponse.data;
      const weatherIcon = this.getWeatherIcon(weather.weather[0].main);

      // 도시명 표시 (한국어 이름이 있으면 사용, 없으면 영어 이름)
      const cityName = location.local_names?.ko || location.name;
      const countryFlag = this.getCountryFlag(location.country);

      return `${weatherIcon} ${cityName} ${countryFlag} 날씨 정보
━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ 현재 온도: ${Math.round(weather.main.temp)}°C
🤗 체감 온도: ${Math.round(weather.main.feels_like)}°C
💧 습도: ${weather.main.humidity}%
☁️ 날씨: ${weather.weather[0].description}
📍 위치: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}

💡 사용법: /weather`;
    } catch (error) {
      console.error("Weather by location error:", error);
      return `❌ 날씨 정보를 가져오는데 실패했습니다.\n잠시 후 다시 시도해주세요.`;
    }
  }

  private getCountryFlag(countryCode: string): string {
    const flags: { [key: string]: string } = {
      KR: "🇰🇷",
      US: "🇺🇸",
      CN: "🇨🇳",
      JP: "🇯🇵",
      GB: "🇬🇧",
      FR: "🇫🇷",
      DE: "🇩🇪",
      IT: "🇮🇹",
      ES: "🇪🇸",
      CA: "🇨🇦",
      AU: "🇦🇺",
      BR: "🇧🇷",
      IN: "🇮🇳",
      RU: "🇷🇺",
      TH: "🇹🇭",
      VN: "🇻🇳",
      SG: "🇸🇬",
      MY: "🇲🇾",
      PH: "🇵🇭",
      ID: "🇮🇩"
    };

    return flags[countryCode] || "🌍";
  }

  private getWeatherIcon(weatherMain: string): string {
    const icons: { [key: string]: string } = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Smoke: "🌫️",
      Haze: "🌫️",
      Dust: "🌫️",
      Fog: "🌫️",
      Sand: "🌫️",
      Ash: "🌫️",
      Squall: "💨",
      Tornado: "🌪️"
    };

    return icons[weatherMain] || "🌤️";
  }
}
