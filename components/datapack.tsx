import { Avatar, Alert, Box, Button, Card, CardContent, Snackbar, CardMedia, Checkbox, Chip, Collapse, Divider, FormControlLabel, Grid, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack, Switch, Tooltip, Typography } from "@mui/material";
import React, { useState, useEffect, MouseEvent, useCallback } from "react";
import useTranslation from 'next-translate/useTranslation'
import { TransitionGroup } from "react-transition-group";
import { faFileArchive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Contributor } from "../lib/datapacks";
import FavoriteIcon from '@mui/icons-material/Favorite';
import fileDownload from 'js-file-download'
import LoadingButton from '@mui/lab/LoadingButton';
import CountUp from 'react-countup';

interface IDictionary {
    [index: string]: boolean;
}

interface DatapackVersion {
    canal?: string | null,
    version?: string | null,
    type?: 'dev' | 'release' | null,
    commit?: string,
    modules?: string[] | null
}

interface ListModules {
    [index: string]: any;
}

export default function Datapack({ data, minHeight }: any) {

    const { t, lang } = useTranslation('common')

    // let selectedVersion: DatapackVersion|null
    // let setSelectedVersion: React.Dispatch<React.SetStateAction<DatapackVersion>>|React.Dispatch<React.SetStateAction<null>>

    let LastRelease: DatapackVersion | null = null

    if (data.releases != null) {
        const lastCanal = data.releases[Object.keys(data.releases)[0]];
        LastRelease = lastCanal?.versions[0]
    }

    const [openSnackPreparing, setOpenSnackPreparing] = React.useState(false);
    const [openSnackReady, setOpenSnackReady] = React.useState(false);

    const handleCloseSnack = (event: any, reason?: any) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackPreparing(false);
        setOpenSnackReady(false);
    };

    let [selectedVersion, setSelectedVersion] = React.useState<DatapackVersion | null>(null);
    // setSelectedVersion(data.releases[Object.keys(data.releases)[Object.keys(data.releases).length - 1]].versions.pop())
    // console.log(selectedVersion.canal)

    let activeModules: IDictionary
    let setActiveModules: React.Dispatch<React.SetStateAction<IDictionary>>

    [activeModules, setActiveModules] = useState({});
    let [urlDatapack, setUrlDatapack] = useState('');
    let [devVersion, setDevVersion] = useState(false);
    let [isDownloading, setIsDownloading] = useState(false);

    let [downloadNumber, setDownloadNumber] = useState(1);

    const changeVersion = useCallback((version: DatapackVersion | null) => {
        if (version == null) { return }
        let updatedModules: IDictionary = {}
        version.modules?.map(module => {
            if (!activeModules.hasOwnProperty(module)) {
                updatedModules[module] = true;
            }
        })
        setActiveModules({
            ...activeModules,
            ...updatedModules
        })
        setSelectedVersion(version);
    }, [activeModules, setActiveModules])

    const handleDevClick = (event: MouseEvent<HTMLButtonElement>) => {
        setDevVersion(!(devVersion));
    }

    const handleListItemClick = (event: MouseEvent<HTMLDivElement>, version: DatapackVersion) => {
        // console.log('handleListItemClick')
        changeVersion(version);

    };

    const handleModuleChange = (module: string, activeModules: IDictionary) => {
        // console.log('handleModuleChange')
        // let modules = activeModules
        let updatedModules: IDictionary = {}

        if (!(data.required_modules.includes(module))) {
            updatedModules[module] = !(activeModules[module]);
        }
        else {
            updatedModules[module] = true
        }

        setActiveModules({
            ...activeModules,
            ...updatedModules
        })
    }

    const handleModuleAllChange = () => {
        if (selectedVersion) {
            let updatedModules: IDictionary = {}

            if (!(selectedVersion.modules?.every((module) => activeModules[module] == true))) {
                selectedVersion.modules?.map(module => {
                    updatedModules[module] = true;
                })
            }
            else {
                selectedVersion.modules?.map(module => {
                    if (!(data.required_modules.includes(module))) {
                        updatedModules[module] = false;
                    }
                })
            }
            setActiveModules({
                ...activeModules,
                ...updatedModules
            })
        }

    }

    async function updateDownloadCounter(){

        const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/counter`)
        const data = await res.json()

        setDownloadNumber(data.download);
    }
    updateDownloadCounter()
    useEffect(() => {


        if (selectedVersion) {
            let modules = [] as unknown as ListModules;
            Object.keys(activeModules).map(module => {
                if (activeModules[module] && selectedVersion?.modules?.includes(module)) {
                    modules.push(module)
                }
            })
            setUrlDatapack(`/api/datapacks/${selectedVersion.canal}/${selectedVersion.version}/${selectedVersion.commit}/${modules.join('|')}`)
        } else {
            changeVersion(LastRelease);
        }

    }, [selectedVersion, activeModules, changeVersion, LastRelease])
    // console.log(data)

    async function downloadFromButton() {
        if (selectedVersion) {
            await setOpenSnackPreparing(true);
            await setIsDownloading(true)
            const res = await fetch(`${process.env.NEXT_PUBLIC_URL}urlDatapack`)
            const data = await res.arrayBuffer()
            fileDownload(data, `Glibs-${selectedVersion.version}.zip`);
            await setIsDownloading(false)
            await setOpenSnackReady(true);
        }
    }

    return (
        <>
            <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} onClose={handleCloseSnack} sx={{ zIndex: (theme) => theme.zIndex.drawer + 10 }} open={openSnackPreparing} autoHideDuration={10000}>
                <Alert elevation={6} variant="filled" onClose={handleCloseSnack} severity="info" sx={{ width: '100%' }}>
                    {t('datapack.download.startLoading')}
                </Alert>
            </Snackbar>
            <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} onClose={handleCloseSnack} sx={{ zIndex: (theme) => theme.zIndex.drawer + 10 }} open={openSnackReady} autoHideDuration={10000}>
                <Alert elevation={6} variant="filled" onClose={handleCloseSnack} severity="success" sx={{ width: '100%' }}>
                    {t('datapack.download.success')}
                </Alert>
            </Snackbar>
            <Grid container columns={{ xs: 1, md: 2, lg: 3 }} spacing={4} sx={{ mb: 2, mt: 0, px: { xs: 4, md: 14 }, '& > *': { pt: "0!important" as "0", mt: "32px!important" as "32px", '&.heightViewport': { maxHeight: { xs: 'auto', md: `calc(${minHeight} - 48px)` } } } }}>
                <Grid item xs={1} md={2} lg={1} sx={{ overflowY: 'auto', scrollbarWidth: 'thin', height: { xs: 'auto', lg: `calc(${minHeight} - 48px)` } }}>
                    <Stack spacing={4}>
                        <Card>
                            <CardMedia
                                component="img"
                                sx={{ width: 140, m: 2 }}
                                image="/glib.png"
                                alt="Glib"
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h2">
                                    {t('datapack.name')}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {t('datapack.description')}
                                </Typography>
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', '& > *': { mr: "8px!important" as "8px", mb: "8px!important" as "8px" } }}>
                                    <Link href="https://gunivers.net/gunivers-lib/">
                                        <Button variant="contained">{t('datapack.buttons.project')}</Button>
                                    </Link>
                                    <Link href="https://glib-core.readthedocs.io/en/latest/index.html">
                                        <Button variant="contained">{t('datapack.buttons.documentation')}</Button>
                                    </Link>
                                    <Link href="https://github.com/Gunivers/Glib">
                                        <Button variant="outlined">{t('datapack.buttons.git')}</Button>
                                    </Link>
                                    <Link href="https://utip.io/gunivers">
                                        <Button variant="outlined" endIcon={<FavoriteIcon />}>{t('datapack.buttons.utip')}</Button>
                                    </Link>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography variant="h3" gutterBottom>{'Téléchargements'}</Typography>
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', '& > *': { mr: "8px!important" as "8px", mb: "8px!important" as "8px" } }}>
                                    <Typography variant="body1" color="text.secondary">
                                        <CountUp
                                            start={0}
                                            end={downloadNumber}
                                            duration={2.75}
                                            separator=" "
                                            suffix=" downloads"
                                        />
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography variant="h3" gutterBottom>{t('datapack.contributors')}</Typography>
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', '& > *': { mr: "8px!important" as "8px", mb: "8px!important" as "8px" } }}>
                                    {data.contributors?.map((contributor: Contributor) => (
                                        <Tooltip key={contributor.id} title={contributor.login}>
                                            <Link href={contributor.url}>
                                                <Avatar src={contributor.avatar_url} alt={contributor.login} />
                                            </Link>
                                        </Tooltip>
                                    ))}
                                </Box>
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', '& > *': { mr: 1, mb: 1 } }}>
                                    <Link href="https://gunivers.net/">
                                        <Typography variant="body2" color="text.secondary">{t('datapack.by-gunivers')}</Typography>
                                    </Link>
                                    <Link href="https://gunivers.net/mentions-legales/">
                                        <Typography variant="body2" color="text.secondary">{t('site.legal-notice')}</Typography>
                                    </Link>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', '& > *': { mr: 1 } }}>
                                <a href="https://mtxserv.com/fr/?utm_source=altearn_website&utm_medium=website&utm_campaign=altearn" title="Louez votre serveur haute qualité, profitez pleinement de vos jeux préférés">
                                    <img src="https://mtxserv.com/build/img/banners/serveur_minecraft.png" height="80" alt='MTxServ' />
                                </a>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <p>Merci à notre partenaire <a style={{ textDecoration: 'underline' }} href="https://mtxserv.com/fr/?utm_source=altearn_website&utm_medium=website&utm_campaign=altearn">mTxServ</a> !</p>
                                </Box>
                            </Box>
                        </Card>
                    </Stack>
                </Grid>
                <Grid item xs={1} md={1} lg={1} className={"heightViewport"}>
                    <Card sx={{ bgcolor: 'background.paper', gridColumn: '2', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h3">{t('datapack.versions.title')}</Typography>
                                <FormControlLabel control={<Switch checked={devVersion} onClick={(event) => handleDevClick(event)} />} label="Dev" />
                            </Box>
                        </CardContent>
                        <List sx={{ overflowY: 'auto', '& ul': { padding: 0 }, py: 0, scrollbarWidth: 'thin', height: 'fit-content' }}>
                            <Collapse in={devVersion}>
                                <ul>
                                    <ListSubheader>{t('datapack.versions.dev')}</ListSubheader>
                                    {data.devs.map((version: DatapackVersion) => (
                                        <ListItemButton
                                            key={version.canal}
                                            selected={selectedVersion === version}
                                            onClick={(event) => handleListItemClick(event, version)}
                                        >
                                            <ListItemText primary={version.canal} />
                                        </ListItemButton>
                                    ))}
                                </ul>
                            </Collapse>
                            {Object.keys(data.releases).map(canalId => (
                                <Canal key={canalId} canal={data.releases[canalId]} selectedVersion={selectedVersion} handleListItemClick={handleListItemClick} />
                            ))}
                        </List>
                    </Card>
                </Grid>
                {selectedVersion != null &&
                    <Grid item xs={1} md={1} lg={1} sx={{ overflowY: 'auto', scrollbarWidth: 'thin' }} className={"heightViewport"}>
                        <Stack spacing={4}>
                            <Card sx={{ height: 'min-content' }}>
                                <CardContent>
                                    <Stack spacing={3}>
                                        <Stack spacing={1} direction="row" sx={{ mt: 2 }}>
                                            <Typography variant="h2">{selectedVersion.canal} - {selectedVersion.version}</Typography>
                                            <Chip label={selectedVersion.commit} size="small" />
                                        </Stack>
                                        <Box>
                                            <LoadingButton loadingPosition="start" loading={isDownloading} variant="contained" onClick={() => downloadFromButton()} startIcon={<FontAwesomeIcon icon={faFileArchive} />}>{isDownloading ? t('datapack.download.load') : t('datapack.download.btn')}</LoadingButton>
                                            <Typography variant="body2" color="text.secondary" sx={{ p:0, m:0 }}>{isDownloading ? ``: ''}</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                            {selectedVersion.modules?.length != 0 &&
                                <Card>
                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Typography gutterBottom variant="h3">
                                            {t('datapack.modules.title')}
                                        </Typography>
                                        <FormControlLabel
                                            label={t('datapack.modules.all')}
                                            control={
                                                <Checkbox
                                                    checked={selectedVersion.modules?.every((module) => activeModules[module] == true)}
                                                    indeterminate={!(selectedVersion.modules?.every((module) => activeModules[module] == true)) && !(selectedVersion.modules?.every((module) => activeModules[module] == false))}
                                                    onChange={handleModuleAllChange}
                                                />
                                            }
                                        />
                                        <Divider />
                                        <List sx={{ overflowY: "auto", scrollbarWidth: 'thin' }}>
                                            <TransitionGroup>
                                                {selectedVersion.modules?.map((module) => (
                                                    <Collapse key={module}>
                                                        <ListItem disablePadding >
                                                            <ListItemButton onClick={(event) => handleModuleChange(module, activeModules)} dense>
                                                                <ListItemIcon>
                                                                    <Checkbox
                                                                        edge="start"
                                                                        checked={activeModules[module]}
                                                                        tabIndex={-1}
                                                                        inputProps={{ 'aria-labelledby': module }}
                                                                        disabled={data.required_modules?.includes(module)}
                                                                    />
                                                                </ListItemIcon>
                                                                <ListItemText id={module} primary={module} />
                                                            </ListItemButton>
                                                        </ListItem>
                                                    </Collapse>
                                                ))}
                                            </TransitionGroup>
                                        </List>
                                    </CardContent>
                                </Card>
                            }
                        </Stack>
                    </Grid>
                }
            </Grid>
        </>
    )
}

export function Canal({ canal, selectedVersion, handleListItemClick }: any) {
    return (
        <ul>
            <ListSubheader>{canal.canal}</ListSubheader>
            {canal.versions.map((version: DatapackVersion) => (
                <Version version={version} key={version.version} selectedVersion={selectedVersion} handleListItemClick={handleListItemClick} />
            ))}
        </ul>
    )
}

export function Version({ version, selectedVersion, handleListItemClick }: any) {
    return (
        <>
            <ListItemButton
                key={version.version}
                selected={selectedVersion === version}
                onClick={(event) => handleListItemClick(event, version)}
            >
                <ListItemText primary={version.version} />
            </ListItemButton>
        </>
    )
}