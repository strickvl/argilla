import { type NuxtAxiosInstance } from "@nuxtjs/axios";
import { NuxtRuntimeConfig } from "@nuxt/types/config/runtime";
import { AxiosError } from "axios";
import { Auth } from "@nuxtjs/auth-next";
import { Response } from "../types";
import {
  OAuthParams,
  OAuthProvider,
  ProviderType,
} from "~/v1/domain/entities/oauth/OAuthProvider";
import { IOAuthRepository } from "~/v1/domain/services/IOAuthRepository";
import { RouterService } from "~/v1/domain/services/RouterService";

const OAUTH_API_ERRORS = {
  ERROR_FETCHING_OAUTH_PROVIDERS: "ERROR_FETCHING_OAUTH_PROVIDERS",
  ERROR_FETCHING_OAUTH_ACCESS_TOKEN: "ERROR_FETCHING_OAUTH_ACCESS_TOKEN",
};

interface BackendOAuthProvider {
  name: "huggingface";
}

export class OAuthRepository implements IOAuthRepository {
  private readonly axios: NuxtAxiosInstance;
  constructor(
    axios: NuxtAxiosInstance,
    private readonly router: RouterService,
    private readonly config: NuxtRuntimeConfig,
    private readonly auth: Auth
  ) {
    this.axios = axios.create({
      withCredentials: false,
    });
  }

  async getProviders(): Promise<OAuthProvider[]> {
    try {
      const url = "oauth2/providers";

      const { data } = await this.axios.get<Response<BackendOAuthProvider[]>>(
        url
      );

      return data.items.map((i) => new OAuthProvider(i.name));
    } catch {
      throw {
        response: OAUTH_API_ERRORS.ERROR_FETCHING_OAUTH_PROVIDERS,
      };
    }
  }

  authorize(provider: ProviderType) {
    this.router.go(
      `${this.config.backendURL}/api/oauth2/${provider}/authorize`,
      true
    );
  }

  async login(provider: ProviderType, oauthParams: OAuthParams) {
    try {
      const url = `oauth2/${provider}/access-token`;

      const params = this.createParams(oauthParams);

      const { data } = await this.axios.get<{ access_token: string }>(url, {
        params,
      });

      await this.auth.setUserToken(data.access_token);
    } catch (error) {
      if (error instanceof AxiosError && error.code === "ERR_BAD_REQUEST") {
        return this.authorize(provider);
      }

      throw {
        response: OAUTH_API_ERRORS.ERROR_FETCHING_OAUTH_ACCESS_TOKEN,
      };
    }
  }

  private createParams(oauthParams: OAuthParams) {
    const params = new URLSearchParams();

    Object.entries(oauthParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });

    return params;
  }
}
