pragma solidity ^0.4.23;

contract PrizeLedger {
  struct Prize {
    uint id;
    uint owner_id;    // current owner
    string name;      // name of prize
  }

  mapping (uint => Prize) public prizes;

  // Constructor makes 10 prizes
  constructor() public {
    for (uint i=1; i <= 10; i++) {
        Prize memory prize = Prize({id: i, owner_id: 0, name: ""});
        prizes[i] = prize;
    }
  }

  function name_and_award_prize(uint _id, uint _owner_id ,string _name) public {
    var prize = prizes[_id];
    require (prize.id != 0);
    require (_owner_id > 0);
    prize.name = _name;
    prize.owner_id = _owner_id;
  }
}
