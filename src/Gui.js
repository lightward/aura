import { GUI } from 'dat.gui';

let InitGui = (settings, params, callbacks) => {
    let gui = new GUI({ name: 'params', load: settings })

    let { appParams, globalParams, feedbackSettings, layer1, layer2 } = params;
    let { setFullscreen, setParams } = callbacks;

    gui.remember(appParams)
    gui.add(appParams, 'autoSave');
    gui.add(appParams, 'fullscreen').listen().onChange(setFullscreen)
    gui.add(appParams, 'autoPlay').listen()

    // Global
    gui.remember(globalParams);
    let folder = gui.addFolder('Global')
    folder.add(globalParams, 'speed').min(0.01).max(1).step(.01).listen().onChange(setParams);
    folder.add(globalParams, 'noise').min(0.).max(.1).step(.001).listen().onChange(setParams);
    folder.add(globalParams, 'seed').min(0.).max(10000).step(1).listen().onChange(setParams);
    folder.open();

    // Feedback settings
    gui.remember(feedbackSettings)
    let feedbackFolder = gui.addFolder('Feedback');
    feedbackFolder.add(feedbackSettings, 'amount').min(0).max(1).step(.01).listen().onChange(setParams);
    feedbackFolder.add(feedbackSettings, 'dist').min(0).max(1).step(.01).listen().onChange(setParams);
    feedbackFolder.open();

    // Layer 1
    gui.remember(layer1)
    let layer1Folder = gui.addFolder('Layer 1');
    layer1Folder.add(layer1, 'brightness').min(0).max(1).step(.01).listen().onChange(setParams);
    layer1Folder.add(layer1, 'blobbyness').min(0).max(4).step(.1).listen().onChange(setParams);
    layer1Folder.add(layer1, 'blur').min(0).max(3).step(.01).listen().onChange(setParams);
    layer1Folder.add(layer1, 'enabled').listen().onChange(setParams);
    layer1Folder.open();

    // Layer 2
    gui.remember(layer2)
    let layer2Folder = gui.addFolder('Layer 2');
    layer2Folder.add(layer2, 'brightness').min(0).max(1).step(.01).listen().onChange(setParams);
    layer2Folder.add(layer2, 'enabled').listen().onChange(setParams);
    layer2Folder.add(layer2, 'cycleSpeed').min(0).max(2).step(.01).listen().onChange(setParams);
    layer2Folder.open();

    // Autosave interval
    setInterval(() => {
        if (appParams.autoSave)
            gui.save()
    }, 1000);
}

export { InitGui }