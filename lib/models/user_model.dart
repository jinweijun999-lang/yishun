import 'package:flutter/foundation.dart';

enum MemberStatus { free, premium }

class UserModel extends ChangeNotifier {
  String? _userId;
  String? _email;
  String? _name;
  MemberStatus _memberStatus = MemberStatus.free;
  DateTime? _memberExpireDate;
  int _freeUsesRemaining = 3;
  bool _isLoggedIn = false;

  String? get userId => _userId;
  String? get email => _email;
  String? get name => _name;
  MemberStatus get memberStatus => _memberStatus;
  DateTime? get memberExpireDate => _memberExpireDate;
  int get freeUsesRemaining => _freeUsesRemaining;
  bool get isLoggedIn => _isLoggedIn;
  bool get isPremium => _memberStatus == MemberStatus.premium;

  void setUser({
    required String userId,
    required String email,
    String? name,
    MemberStatus? memberStatus,
    DateTime? memberExpireDate,
  }) {
    _userId = userId;
    _email = email;
    _name = name;
    _memberStatus = memberStatus ?? MemberStatus.free;
    _memberExpireDate = memberExpireDate;
    _isLoggedIn = true;
    notifyListeners();
  }

  void setMemberStatus(MemberStatus status, {DateTime? expireDate}) {
    _memberStatus = status;
    _memberExpireDate = expireDate;
    notifyListeners();
  }

  bool useFreeCredit() {
    if (_freeUsesRemaining > 0) {
      _freeUsesRemaining--;
      notifyListeners();
      return true;
    }
    return false;
  }

  void resetFreeCredits() {
    _freeUsesRemaining = 3;
    notifyListeners();
  }

  void logout() {
    _userId = null;
    _email = null;
    _name = null;
    _memberStatus = MemberStatus.free;
    _memberExpireDate = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
