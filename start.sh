# 키저장소 삭제
rm -rf 인증서_펫샵
rm -rf 인증서_농장
rm -rf 인증서_병원
rm -rf 인증서_DogDoq
# CA 0,1,2,3 관리자 등록
nodejs ./enroll_CA/enroll_CA1_Admin.js
echo "펫샵 CA서버 관리자 등록완료"
echo ""
nodejs ./enroll_CA/enroll_CA2_Admin.js
echo "농장 CA서버 관리자 등록완료"
echo ""
nodejs ./enroll_CA/enroll_CA3_Admin.js
echo "병원 CA서버 관리자 등록완료"
echo ""
nodejs ./enroll_CA/enroll_CA4_Admin.js
echo "DogDoq CA서버 관리자 등록완료"
echo ""
# 서버 가동 
echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo
nodejs server.js
