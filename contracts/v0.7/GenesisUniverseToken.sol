// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GenesisUniverseToken is ERC20 {
    using SafeMath for uint256;

    uint256 public constant MAX_SUPPLY = 1e9 * 1e18;

    constructor(
        address _playToEarnAddr,
        address _privateSaleAddr,
        address _teamAddr,
        address _stakingPoolAddr,
        address _marketingAddr,
        address _operationAddr
    ) ERC20("GenesisUniverseToken", "GUT") {
        _mint(_playToEarnAddr, MAX_SUPPLY.mul(50).div(100));
        _mint(_privateSaleAddr, MAX_SUPPLY.mul(15).div(100));
        _mint(_teamAddr, MAX_SUPPLY.mul(15).div(100));
        _mint(_stakingPoolAddr, MAX_SUPPLY.mul(10).div(100));
        _mint(_marketingAddr, MAX_SUPPLY.mul(5).div(100));
        _mint(_operationAddr, MAX_SUPPLY.mul(5).div(100));
    }
}
