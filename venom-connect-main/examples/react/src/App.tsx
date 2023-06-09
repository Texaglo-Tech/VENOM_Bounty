import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Box, Button, Container, Divider, Grid, Typography, TextField } from "@mui/material";
import axios from 'axios';

const initTheme = "light" as const;

const standaloneFallback = () =>
  EverscaleStandaloneClient.create({
    connection: {
      id: 1000,
      group: "venom_testnet",
      type: "jrpc",
      data: {
        endpoint: "https://jrpc.venom.foundation/rpc",
      },
    },
  });

const initVenomConnect = async () => {
  return new VenomConnect({
    theme: initTheme,
    checkNetworkId: 1000,
    providersOptions: {
      venomwallet: {
        links: {},
        walletWaysToConnect: [
          {
            package: ProviderRpcClient,
            packageOptions: {
              fallback:
                VenomConnect.getPromise("venomwallet", "extension") ||
                (() => Promise.reject()),
              forceUseFallback: true,
            },
            packageOptionsStandalone: {
              fallback: standaloneFallback,
              forceUseFallback: true,
            },
            id: "extension",
            type: "extension",
          },
        ],
        defaultWalletWaysToConnect: [
          "mobile",
          "ios",
          "android",
        ],
      },
    },
  });
};

const App = () => {
  const [venomConnect, setVenomConnect] = useState<any>();
  const [venomProvider, setVenomProvider] = useState<any>();
  const [address, setAddress] = useState<string | undefined>();
  const [balance, setBalance] = useState<string | undefined>();
  const [theme, setTheme] = useState(initTheme);
  const [info, setInfo] = useState("");
  const [standaloneMethodsIsFetching, setStandaloneMethodsIsFetching] =
    useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [userId, setUserId] = useState("");
  const [githubIssue, setGithubIssue] = useState("");

  const handleGithubTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGithubToken(event.target.value);
  };
  
  const handleUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(event.target.value);
  };
  
  const handleGithubIssueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGithubIssue(event.target.value);
  };
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    const oracleApi = "http://20.169.154.128:8000/"; // replace with your Oracle API
  
    try {
      const response = await axios.post(oracleApi, {
        user_id: userId,
        url_input: githubIssue,
        task_index: 0
      }, {
        headers: {
          "access_token": githubToken,
          "Content-Type": "application/json"
        }
      });
  
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const getAddress = async (provider: any) => {
    const providerState = await provider?.getProviderState?.();
    const address =
      providerState?.permissions.accountInteraction?.address.toString();
    return address;
  };

  const getBalance = async (provider: any, _address: string) => {
    try {
      const providerBalance = await provider?.getBalance?.(_address);
      return providerBalance;
    } catch (error) {
      return undefined;
    }
  };

  const checkAuth = async (_venomConnect: any) => {
    const auth = await _venomConnect?.checkAuth();
    if (auth) await getAddress(_venomConnect);
  };

  const onInitButtonClick = async () => {
    const initedVenomConnect = await initVenomConnect();
    setVenomConnect(initedVenomConnect);
    await checkAuth(initedVenomConnect);
    initedVenomConnect.connect();
  };

  const onConnectButtonClick = async () => {
    venomConnect?.connect();
  };

  const onDisconnectButtonClick = async () => {
    venomProvider?.disconnect();
  };

  const check = async (_provider: any) => {
    const _address = _provider ? await getAddress(_provider) : undefined;
    const _balance =
      _provider && _address ? await getBalance(_provider, _address) : undefined;

    setAddress(_address);
    setBalance(_balance);

    if (_provider && _address)
      setTimeout(() => {
        check(_provider);
      }, 7000);
  };

  const onConnect = async (provider: any) => {
    setVenomProvider(provider);
    check(provider);
  };

  useEffect(() => {
    const off = venomConnect?.on("connect", onConnect);
    return () => {
      off?.();
    };
  }, [venomConnect]);

  return (
    <Box>
      <Grid container justifyContent="center" my={4}>
        <Grid item>
          <Typography variant="h1" component="h1" textAlign="center">
            Bounty Board
          </Typography>
        </Grid>
      </Grid>
      <Container>
        {!venomProvider && (
          <Grid
            container
            justifyContent={"center"}
            alignItems={"center"}
            marginTop={"25%"}
            gap={2}
          >
            <Grid item>
              <>
                <Button variant="contained" onClick={onInitButtonClick}>
                  Connect to Post
                </Button>
              </>
            </Grid>
          </Grid>
        )}
        {venomProvider && (
          <Grid container direction={"column"} gap={6}>
            <Grid item>
              <form onSubmit={handleFormSubmit}>
                <Grid
                  container
                  direction={"column"}
                  alignItems={"center"}
                  gap={2}
                >
                  <Grid item>
                    <TextField
                      label="GitHub Token"
                      variant="outlined"
                      value={githubToken}
                      onChange={handleGithubTokenChange}
                    />
                  </Grid>
                  <Grid item>
                    <TextField
                      label="User ID"
                      variant="outlined"
                      value={userId}
                      onChange={handleUserIdChange}
                    />
                  </Grid>
                  <Grid item>
                    <TextField
                      label="GitHub Issue URL"
                      variant="outlined"
                      value={githubIssue}
                      onChange={handleGithubIssueChange}
                    />
                  </Grid>
                  <Grid item>
                    <Button variant="contained" type="submit">
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
            <Grid item>
              <Grid
                container
                direction={"column"}
                alignItems={"center"}
                gap={2}
              >
                <Typography variant="h5" component="span">
                Connected wallets :
                </Typography>
                <Divider />
                {address && (
                  <Typography variant="h6" component="span">
                    Address: {address}
                  </Typography>
                )}
                {balance && (
                  <Typography variant="h6" component="span">
                    Balance: {balance}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default App;
