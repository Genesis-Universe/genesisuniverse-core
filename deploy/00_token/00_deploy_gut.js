module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {
        deployer,
        playToEarn,
        privateSale,
        team,
        stakingPool,
        marketing,
        operation,
    } = namedAccounts;
    await deploy('GenesisUniverseToken', {
        from: deployer,
        args: [
            playToEarn,
            privateSale,
            team,
            stakingPool,
            marketing,
            operation,
        ],
        skipIfAlreadyDeployed: true,
        log: true,
    });
};
module.exports.tags = ['GUT', 'GUT_deploy'];
